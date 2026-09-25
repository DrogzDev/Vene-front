import { useEffect, useRef, useState } from "react"

import { getAlerts, markAlertsRead } from "../../services/alerts"
import type { DollarAlert } from "../../services/alerts"
import { BANK_ALERT_RECEIVED_EVENT, isPriceAlertPayload } from "../../services/notifications"
import { areBankAlertsEnabled, disableBankAlerts, enableBankAlerts } from "../../services/bankAlertsPush"

const ALERTS_ENABLED_KEY = "bancamiga_alerts_enabled"
const ALERT_SOUND_ENABLED_KEY = "bancamiga_alert_sound_enabled"
const ALERT_SOUND_URL = "/sounds/bancamiga-alert.mp3"

/**
 * Alertas bancarias de la campana de Inicio: lista, no leídas, push web,
 * sonido y mensajes del Service Worker.
 *
 * Misma lógica que vivía dentro de pages/home.tsx, movida sin cambios.
 */
export function useBankAlerts() {
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [alerts, setAlerts] = useState<DollarAlert[]>([])
  const [alertsEnabled, setAlertsEnabled] = useState(false)
  const [alertsEnabling, setAlertsEnabling] = useState(false)
  const [alertsDisabling, setAlertsDisabling] = useState(false)
  const [alertsError, setAlertsError] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)

  const alertAudioRef = useRef<HTMLAudioElement | null>(null)
  const lastSwAlertIdRef = useRef<number | string | null>(null)

  function getAlertAudio() {
    if (!alertAudioRef.current) {
      alertAudioRef.current = new Audio(ALERT_SOUND_URL)
      alertAudioRef.current.preload = "auto"
      alertAudioRef.current.volume = 1
    }

    return alertAudioRef.current
  }

  async function enableAlertSound() {
    try {
      const audio = getAlertAudio()

      audio.currentTime = 0
      await audio.play()
      audio.pause()
      audio.currentTime = 0

      localStorage.setItem(ALERT_SOUND_ENABLED_KEY, "true")
    } catch (err) {
      console.warn("No se pudo desbloquear el sonido:", err)

      localStorage.removeItem(ALERT_SOUND_ENABLED_KEY)

      setAlertsError(
        "Las alertas se activaron, pero el navegador bloqueó el sonido. En permisos del sitio cambia Sonido a Permitir."
      )
    }
  }

  function playAlertSound() {
    if (localStorage.getItem(ALERT_SOUND_ENABLED_KEY) !== "true") return

    const audio = getAlertAudio()

    audio.currentTime = 0

    audio.play().catch((err) => {
      console.warn("No se pudo reproducir el sonido de alerta:", err)

      localStorage.removeItem(ALERT_SOUND_ENABLED_KEY)

      setAlertsError("El navegador bloqueó el sonido. En permisos del sitio cambia Sonido a Permitir.")
    })
  }

  async function loadAlerts() {
    try {
      setAlertsError("")

      const result = await getAlerts(5)

      setAlerts(result.alerts)
      setUnreadCount(result.unreadCount)
    } catch (err) {
      console.error("Error cargando alertas:", err)
      setAlertsError(err instanceof Error ? err.message : "Error cargando alertas")
    }
  }

  async function enableAlerts() {
    if (alertsEnabled || alertsEnabling) return

    try {
      setAlertsError("")
      setAlertsEnabling(true)

      await enableBankAlerts()

      setAlertsEnabled(true)
      localStorage.setItem(ALERTS_ENABLED_KEY, "true")
    } catch (err) {
      console.warn("No se pudieron activar las alertas push:", err)

      setAlertsEnabled(false)
      localStorage.removeItem(ALERTS_ENABLED_KEY)
      localStorage.removeItem(ALERT_SOUND_ENABLED_KEY)

      setAlertsError(err instanceof Error ? err.message : "No se pudieron activar las alertas push.")
    } finally {
      setAlertsEnabling(false)
    }
  }

  async function disableAlerts() {
    if (!alertsEnabled || alertsDisabling) return

    try {
      setAlertsError("")
      setAlertsDisabling(true)

      await disableBankAlerts()

      setAlertsEnabled(false)
      localStorage.removeItem(ALERTS_ENABLED_KEY)
      localStorage.removeItem(ALERT_SOUND_ENABLED_KEY)
    } catch (err) {
      console.warn("No se pudieron desactivar las alertas push:", err)

      setAlertsError(err instanceof Error ? err.message : "No se pudieron desactivar las alertas push.")
    } finally {
      setAlertsDisabling(false)
    }
  }

  async function openAlerts() {
    setAlertsOpen(true)

    try {
      setAlertsError("")

      const result = await getAlerts(5)

      setAlerts(result.alerts)
      setUnreadCount(result.unreadCount)

      const unreadAlertIds = result.alerts.filter((alert) => !alert.is_read).map((alert) => alert.id)

      if (unreadAlertIds.length > 0) {
        await markAlertsRead(unreadAlertIds)

        setAlerts((currentAlerts) => currentAlerts.map((alert) => ({ ...alert, is_read: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error("Error abriendo alertas:", err)
      setAlertsError(err instanceof Error ? err.message : "Error abriendo alertas")
    }
  }

  useEffect(() => {
    loadAlerts()

    if (localStorage.getItem(ALERT_SOUND_ENABLED_KEY) === "true") {
      getAlertAudio()
    }
    // Solo al montar, como antes.
  }, [])

  useEffect(() => {
    let cancelled = false

    function clearState() {
      setAlertsEnabled(false)
      localStorage.removeItem(ALERTS_ENABLED_KEY)
      localStorage.removeItem(ALERT_SOUND_ENABLED_KEY)
    }

    async function restorePushState() {
      // Web: suscripción del navegador. APK: permiso + token + bank_alerts
      // confirmado por el servidor. Ver services/bankAlertsPush.ts.
      try {
        const enabled = await areBankAlertsEnabled()

        if (cancelled) return

        if (enabled) {
          setAlertsEnabled(true)
          localStorage.setItem(ALERTS_ENABLED_KEY, "true")
        } else {
          clearState()
        }
      } catch (err) {
        if (cancelled) return

        console.warn("No se pudo restaurar el estado push:", err)
        clearState()
      }
    }

    restorePushState()

    return () => {
      cancelled = true
    }
  }, [])

  // Las alertas bancarias NUNCA se abren solas al arrancar la app: solo al
  // tocar la campana (en Más) o una notificación de alerta.

  useEffect(() => {
    function handleFocus() {
      loadAlerts()
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  // APK: alerta bancaria por FCM con la app abierta → sonido y recarga.
  useEffect(() => {
    function handleNativeBankAlert() {
      playAlertSound()
      loadAlerts()
    }

    window.addEventListener(BANK_ALERT_RECEIVED_EVENT, handleNativeBankAlert)
    return () => window.removeEventListener(BANK_ALERT_RECEIVED_EVENT, handleNativeBankAlert)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Trae las alertas en caliente cuando llega un push con la app abierta.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    function handleServiceWorkerMessage(event: MessageEvent) {
      const message = event.data

      if (!message || message.type !== "BANK_ALERT_PUSH_RECEIVED") return

      // Las alertas de precio viajan por el mismo SW pero no son
      // bancarias: ni suenan como tal ni recargan la campana.
      if (isPriceAlertPayload(message.payload)) return

      const alertId = message.payload?.alert_id || message.payload?.alertId || message.payload?.id || null

      if (alertId && lastSwAlertIdRef.current === alertId) return

      if (alertId) lastSwAlertIdRef.current = alertId

      playAlertSound()
      loadAlerts()
    }

    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage)
    return () => navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    alertsOpen,
    setAlertsOpen,
    alerts,
    alertsEnabled,
    alertsError,
    unreadCount,
    openAlerts,
    enableAlerts,
    disableAlerts,
    enableAlertSound,
  }
}
