import { PushNotifications } from "@capacitor/push-notifications"
import type { Channel } from "@capacitor/push-notifications"
import type { PluginListenerHandle } from "@capacitor/core"

import { getDeviceId } from "../../utils/device"
import { checkPlayServices } from "./playServices"
import type { PlayServicesStatus } from "./playServices"
import {
  BANK_ALERT_RECEIVED_EVENT,
  PRICE_ALERT_RECEIVED_EVENT,
  safeInternalRoute,
  type NotificationAdapter,
  type PushState,
} from "./types"

/*
 * Push nativo de la APK: @capacitor/push-notifications (FCM).
 *
 * Nada de este archivo usa Web Push, Notification, PushManager ni
 * service workers: eso es solo del navegador (webPushAdapter / push.ts).
 *
 * Tres estados que NO se confunden:
 * - permission:   ¿Android dejó mostrar notificaciones?
 * - registration: ¿tenemos un token FCM registrado en Django?
 * - bank alerts:  ¿Django confirmó bank_alerts=true para ese token?
 * "Alertas bancarias activas" exige las tres.
 */

const API_BASE = import.meta.env.VITE_API_URL

const TOKEN_KEY = "vex_fcm_token"
/** Alertas de precio activadas en este teléfono (fila "Push notifications"). */
const PRICE_ENABLED_KEY = "vex_fcm_push_enabled"
/** Lo que el usuario QUIERE para las alertas bancarias. */
const BANK_WANTED_KEY = "vex_fcm_bank_alerts_wanted"
/** Lo que Django CONFIRMÓ para las alertas bancarias ("true"/"false"). */
const BANK_CONFIRMED_KEY = "vex_fcm_bank_alerts_confirmed"
/** Preferencia vieja del switch de alertas bancarias (versión web). */
const LEGACY_BANK_KEY = "bancamiga_alerts_enabled"

/** Reintentos del registro FCM ante fallos transitorios: 3 como máximo. */
const RETRY_DELAYS_MS = [2000, 5000, 15000]
const REGISTRATION_TIMEOUT_MS = 20000

/** Ids estables: coinciden con MainActivity.java y con el backend. */
const CHANNELS: Channel[] = [
  {
    id: "bank_alerts",
    name: "Alertas bancarias",
    description: "Intervención digital del Banco de Venezuela y Bancamiga.",
    importance: 4,
    visibility: 1,
  },
  {
    id: "price_alerts",
    name: "Alertas de precio",
    description: "Avisos cuando el USDT, el BCV o el Promedio llegan a tu objetivo.",
    importance: 4,
    visibility: 1,
  },
]

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------

function readStorage(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Sin almacenamiento el push sigue funcionando en esta sesión.
  }
}

/** Nunca se imprime un token completo. */
function maskToken(token: string | null | undefined) {
  if (!token) return "none"
  return token.length > 12 ? `${token.slice(0, 6)}…${token.slice(-4)}` : "***"
}

/** Logs de diagnóstico: aparecen en `adb logcat` (Capacitor/Console). */
function pushLog(message: string) {
  console.info(`[PUSH][ANDROID] ${message}`)
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------
// Errores entendibles
// ---------------------------------------------------------------------

/**
 * Error del push nativo con el código real y un mensaje para el usuario.
 * `retryable` indica si tiene sentido ofrecer "Reintentar".
 */
export class NativePushError extends Error {
  code: string
  retryable: boolean
  diagnostics: PlayServicesStatus | null

  constructor(message: string, code: string, retryable: boolean, diagnostics: PlayServicesStatus | null = null) {
    super(message)
    this.name = "NativePushError"
    this.code = code
    this.retryable = retryable
    this.diagnostics = diagnostics
  }
}

const GMS_UNAVAILABLE_MESSAGE =
  "Este dispositivo no puede conectarse con Google Play Services, necesarios para recibir notificaciones push."

/**
 * Traduce el error de FCM combinando señales: el código real de
 * Firebase, el estado de Play Services y el de la red. Ninguna señal se
 * toma como la causa única de SERVICE_NOT_AVAILABLE.
 */
function describeFcmError(raw: string, diagnostics: PlayServicesStatus | null): NativePushError {
  const code = /SERVICE_NOT_AVAILABLE/.test(raw)
    ? "SERVICE_NOT_AVAILABLE"
    : /TIMEOUT|no respondió/i.test(raw)
      ? "TIMEOUT"
      : (raw.match(/[A-Z_]{6,}/)?.[0] ?? "FCM_ERROR")

  if (diagnostics && !diagnostics.available) {
    return new NativePushError(
      `${GMS_UNAVAILABLE_MESSAGE} (Play Services: ${diagnostics.codeName}; Firebase: ${code})`,
      code,
      diagnostics.codeName === "SERVICE_UPDATING",
      diagnostics,
    )
  }

  if (diagnostics && (!diagnostics.online || !diagnostics.internetValidated)) {
    return new NativePushError(
      `No se pudo registrar el teléfono para notificaciones: la red actual no parece tener acceso a internet (Firebase: ${code}). Revisa la conexión y vuelve a intentarlo.`,
      code,
      true,
      diagnostics,
    )
  }

  if (code === "SERVICE_NOT_AVAILABLE" || code === "TIMEOUT") {
    return new NativePushError(
      `No se pudo contactar con los servicios de notificaciones de Google (${code}). Puede deberse a la red, a una VPN o ahorro de datos que bloquea los servicios de Google, a Google Play Services desactualizado o a un fallo temporal.`,
      code,
      true,
      diagnostics,
    )
  }

  return new NativePushError(
    `No se pudo registrar el teléfono para notificaciones (${raw || code}).`,
    code,
    false,
    diagnostics,
  )
}

// ---------------------------------------------------------------------
// Registro FCM
// ---------------------------------------------------------------------

let pendingRegistration: {
  resolve: (token: string) => void
  reject: (error: Error) => void
} | null = null

let registrationListeners: Promise<PluginListenerHandle>[] | null = null

/**
 * Listeners de registro, una sola vez por sesión y SIEMPRE antes de
 * llamar a register(): si el token llegara antes, se perdería.
 */
function ensureRegistrationListeners() {
  if (registrationListeners) return

  registrationListeners = [
    PushNotifications.addListener("registration", (token) => {
      pushLog(`registration success token=${maskToken(token.value)}`)

      if (pendingRegistration) {
        pendingRegistration.resolve(token.value)
        pendingRegistration = null
        return
      }

      // Rotación del token con el push ya activado.
      if (wantsAnyPush()) {
        syncToken(token.value).catch((error) => pushLog(`token sync error=${String(error)}`))
      }
    }),
    PushNotifications.addListener("registrationError", (error) => {
      pushLog(`registration error=${error.error}`)

      if (pendingRegistration) {
        pendingRegistration.reject(new Error(error.error || "FCM_ERROR"))
        pendingRegistration = null
      }
    }),
  ]
}

function registerOnce() {
  return new Promise<string>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      if (pendingRegistration?.reject === reject) {
        pendingRegistration = null
        reject(new Error("TIMEOUT: Firebase no respondió al registrar el dispositivo."))
      }
    }, REGISTRATION_TIMEOUT_MS)

    pendingRegistration = {
      resolve: (token) => {
        window.clearTimeout(timer)
        resolve(token)
      },
      reject: (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    }

    pushLog("registering")
    PushNotifications.register().catch((error) => {
      if (pendingRegistration?.reject) pendingRegistration.reject(error instanceof Error ? error : new Error(String(error)))
      pendingRegistration = null
    })
  })
}

/**
 * register() con reintentos controlados (2s, 5s, 15s). Solo se reintenta
 * lo transitorio; nunca se vuelve a pedir permiso ni hay bucles.
 */
async function registerWithRetry(diagnostics: PlayServicesStatus | null) {
  let lastError: NativePushError | null = null

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    if (attempt > 0) {
      const delay = RETRY_DELAYS_MS[attempt - 1]
      pushLog(`retry ${attempt}/${RETRY_DELAYS_MS.length} in ${delay}ms (last=${lastError?.code})`)
      await wait(delay)
    }

    try {
      return await registerOnce()
    } catch (error) {
      lastError = describeFcmError(error instanceof Error ? error.message : String(error), diagnostics)

      if (!lastError.retryable) break
    }
  }

  // Tras agotar los reintentos se refresca el diagnóstico para el mensaje final.
  const latest = (await checkPlayServices()) ?? diagnostics
  const raw = lastError ? lastError.code : "FCM_ERROR"

  throw describeFcmError(raw, latest)
}

async function postDevice(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-ID": getDeviceId(),
    },
    body: JSON.stringify({ platform: "ANDROID", ...body }),
  })

  pushLog(`token backend response=${response.status} path=${path}`)

  if (!response.ok) {
    throw new NativePushError(
      "El teléfono obtuvo su token de notificaciones, pero el servidor de VeneCambio no pudo registrarlo. Inténtalo de nuevo.",
      `HTTP_${response.status}`,
      true,
    )
  }

  return response.json().catch(() => ({})) as Promise<{ bank_alerts?: boolean }>
}

/*
 * Migración suave: si el switch viejo de alertas bancarias estaba
 * activado, esa intención se copia a BANK_WANTED_KEY al cargar el
 * módulo, antes de que ninguna pantalla pueda limpiar la clave vieja.
 * El siguiente registro de token la sincroniza como bank_alerts=true.
 */
if (readStorage(LEGACY_BANK_KEY) === "true" && readStorage(BANK_WANTED_KEY) === null) {
  writeStorage(BANK_WANTED_KEY, "true")
}

function wantsBankAlerts() {
  return readStorage(BANK_WANTED_KEY) === "true" || readStorage(LEGACY_BANK_KEY) === "true"
}

function wantsAnyPush() {
  return readStorage(PRICE_ENABLED_KEY) === "true" || wantsBankAlerts()
}

/**
 * Registra el token en Django. Si el usuario tenía activadas las alertas
 * bancarias (preferencia nueva o la vieja del switch), se sincroniza
 * bank_alerts=true: así nadie pierde el aviso con la migración.
 */
async function syncToken(token: string) {
  const body: Record<string, unknown> = { token }

  if (wantsBankAlerts()) body.bank_alerts = true

  const device = await postDevice("/push/devices/", body)

  writeStorage(TOKEN_KEY, token)

  if (typeof device.bank_alerts === "boolean") {
    writeStorage(BANK_CONFIRMED_KEY, String(device.bank_alerts))
  }
}

/**
 * Deja el teléfono registrado en FCM y en Django:
 * checkPermissions → requestPermissions (si hace falta) → Play Services →
 * canales → register (con reintentos) → token → Django.
 */
async function ensureRegistered(): Promise<string> {
  let permission = await PushNotifications.checkPermissions()
  pushLog(`permission=${permission.receive}`)

  if (permission.receive === "prompt" || permission.receive === "prompt-with-rationale") {
    permission = await PushNotifications.requestPermissions()
    pushLog(`permission=${permission.receive} (after request)`)
  }

  if (permission.receive !== "granted") {
    throw new NativePushError(
      "Las notificaciones de VeneCambio están bloqueadas. Actívalas en Ajustes de Android > Apps > VeneCambio > Notificaciones.",
      "PERMISSION_DENIED",
      false,
    )
  }

  const diagnostics = await checkPlayServices()
  pushLog(
    `play services=${diagnostics?.codeName ?? "unknown"} version=${diagnostics?.gmsVersion ?? "?"} online=${diagnostics?.online ?? "?"} validated=${diagnostics?.internetValidated ?? "?"}`,
  )

  if (diagnostics && !diagnostics.available && diagnostics.codeName !== "SERVICE_UPDATING") {
    throw new NativePushError(
      `${GMS_UNAVAILABLE_MESSAGE} (${diagnostics.codeName})`,
      diagnostics.codeName,
      false,
      diagnostics,
    )
  }

  for (const channel of CHANNELS) {
    await PushNotifications.createChannel(channel)
  }

  ensureRegistrationListeners()

  const token = await registerWithRetry(diagnostics)

  await syncToken(token)

  return token
}

// ---------------------------------------------------------------------
// API de alertas bancarias (la usa services/bankAlertsPush.ts)
// ---------------------------------------------------------------------

export type NativeBankAlertsStatus = {
  permission: string
  registered: boolean
  bankAlerts: boolean
}

export async function getNativeBankAlertsStatus(): Promise<NativeBankAlertsStatus> {
  const permission = (await PushNotifications.checkPermissions()).receive
  const registered = Boolean(readStorage(TOKEN_KEY))
  const bankAlerts = readStorage(BANK_CONFIRMED_KEY) === "true"

  return { permission, registered, bankAlerts }
}

/**
 * Activa o desactiva las alertas bancarias de este teléfono. Devuelve lo
 * que CONFIRMÓ el servidor: la UI no dice "activadas" sin esa respuesta.
 */
export async function setNativeBankAlerts(enabled: boolean): Promise<boolean> {
  writeStorage(BANK_WANTED_KEY, String(enabled))

  if (!enabled) {
    writeStorage(LEGACY_BANK_KEY, null)

    const token = readStorage(TOKEN_KEY)

    if (token) {
      const device = await postDevice("/push/devices/", { token, bank_alerts: false })
      writeStorage(BANK_CONFIRMED_KEY, String(device.bank_alerts ?? false))
    } else {
      writeStorage(BANK_CONFIRMED_KEY, "false")
    }

    return false
  }

  await ensureRegistered()

  return readStorage(BANK_CONFIRMED_KEY) === "true"
}

// ---------------------------------------------------------------------
// Adapter común (alertas de precio y arranque)
// ---------------------------------------------------------------------

export const androidFcmAdapter: NotificationAdapter = {
  platform: "android",
  sharesBankAlertsSubscription: false,

  async getState(): Promise<PushState> {
    const permission = await PushNotifications.checkPermissions()

    if (permission.receive === "denied") return "denied"

    const diagnostics = await checkPlayServices()

    if (diagnostics && !diagnostics.available) return "unsupported"
    if (permission.receive !== "granted") return "disabled"

    return readStorage(PRICE_ENABLED_KEY) === "true" && readStorage(TOKEN_KEY) ? "enabled" : "disabled"
  },

  async enable() {
    await ensureRegistered()
    writeStorage(PRICE_ENABLED_KEY, "true")
  },

  async disable() {
    writeStorage(PRICE_ENABLED_KEY, null)

    // El token sigue siendo necesario si las alertas bancarias siguen activas.
    if (wantsBankAlerts()) return

    const token = readStorage(TOKEN_KEY)

    if (token) {
      await postDevice("/push/devices/unregister/", { token }).catch(() => {})
    }

    await PushNotifications.unregister().catch(() => {})
    writeStorage(TOKEN_KEY, null)
    writeStorage(BANK_CONFIRMED_KEY, null)
  },

  init(onOpenRoute) {
    ensureRegistrationListeners()

    const handles: Promise<PluginListenerHandle>[] = []

    handles.push(
      PushNotifications.addListener("pushNotificationReceived", (notification) => {
        const type = notification.data?.type
        pushLog(`notification received type=${type ?? "?"} id=${notification.id ?? "?"}`)

        if (type === "PRICE_ALERT") {
          window.dispatchEvent(new CustomEvent(PRICE_ALERT_RECEIVED_EVENT))
        }

        if (type === "BANK_ALERT") {
          window.dispatchEvent(new CustomEvent(BANK_ALERT_RECEIVED_EVENT, { detail: notification.data }))
        }
      }),
    )

    handles.push(
      PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        pushLog(`notification opened type=${action.notification.data?.type ?? "?"}`)

        const route = safeInternalRoute(action.notification.data?.route)

        if (route) onOpenRoute(route)
      }),
    )

    // Con algún push ya activado, registrar en cada arranque recoge las
    // rotaciones del token y migra la preferencia vieja de alertas
    // bancarias. Sin permiso concedido NO se pide nada aquí.
    PushNotifications.checkPermissions()
      .then(async (permission) => {
        if (permission.receive !== "granted" || !wantsAnyPush()) return

        pushLog("startup re-register")

        for (const channel of CHANNELS) {
          await PushNotifications.createChannel(channel)
        }

        const token = await registerWithRetry(await checkPlayServices())
        await syncToken(token)
      })
      .catch((error) => pushLog(`startup register error=${error instanceof Error ? error.message : String(error)}`))

    return () => {
      handles.forEach((handle) => handle.then((h) => h.remove()).catch(() => {}))
    }
  },
}
