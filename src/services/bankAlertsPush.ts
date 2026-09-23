import { Capacitor } from "@capacitor/core"

import {
  NativePushError,
  getNativeBankAlertsStatus,
  setNativeBankAlerts,
} from "./notifications/androidFcmAdapter"
import {
  isCurrentBrowserSubscribed,
  isPushMarkedAsEnabled,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "./push"

/**
 * Transporte de las ALERTAS BANCARIAS según la plataforma.
 *
 * - APK (Capacitor nativo): FCM, a través de androidFcmAdapter. Dentro
 *   de la app nunca se evalúa Notification / PushManager / service
 *   workers, así que nunca aparece "este navegador no soporta…".
 * - Navegador / PWA: el Web Push (VAPID) de siempre, sin cambios.
 */

const isNative = Capacitor.isNativePlatform()

export { NativePushError }

/**
 * ¿Están activas? En la APK exige permiso concedido + token registrado +
 * bank_alerts=true confirmado por el servidor.
 */
export async function areBankAlertsEnabled(): Promise<boolean> {
  if (isNative) {
    const status = await getNativeBankAlertsStatus()

    return status.permission === "granted" && status.registered && status.bankAlerts
  }

  if (!("Notification" in window) || Notification.permission !== "granted") return false

  return (await isCurrentBrowserSubscribed()) || isPushMarkedAsEnabled()
}

export async function enableBankAlerts(): Promise<void> {
  if (isNative) {
    const confirmed = await setNativeBankAlerts(true)

    if (!confirmed) {
      throw new NativePushError(
        "El teléfono quedó registrado, pero el servidor no confirmó las alertas bancarias. Inténtalo de nuevo.",
        "BANK_ALERTS_NOT_CONFIRMED",
        true,
      )
    }

    return
  }

  await subscribeToPushNotifications()
}

export async function disableBankAlerts(): Promise<void> {
  if (isNative) {
    await setNativeBankAlerts(false)
    return
  }

  await unsubscribeFromPushNotifications()
}

/** true si conviene ofrecer "Reintentar" para este error. */
export function isRetryablePushError(error: unknown) {
  return error instanceof NativePushError && error.retryable
}
