import { useEffect, useRef, useState } from "react"
import type { DollarAlert } from "../services/alerts"
import { getLatestAlert } from "../services/alerts"

const LAST_ALERT_KEY = "last_bancamiga_alert_id"

export function useDollarAlerts() {
  const [latestAlert, setLatestAlert] = useState<DollarAlert | null>(null)
  const [hasNewAlert, setHasNewAlert] = useState(false)
  const [alertsError, setAlertsError] = useState("")

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPlayingRef = useRef(false)

  useEffect(() => {
    let intervalId: number

    // Creamos el audio una sola vez
    audioRef.current = new Audio("/sounds/bancamiga-alert.mp3")
    audioRef.current.volume = 0.85

    audioRef.current.addEventListener("ended", () => {
      isPlayingRef.current = false
    })

    async function checkAlert() {
      try {
        setAlertsError("")

        const alert = await getLatestAlert()

        if (!alert) {
          setLatestAlert(null)
          return
        }

        setLatestAlert(alert)

        const lastAlertId = localStorage.getItem(LAST_ALERT_KEY)

        // Primera carga: muestra la última alerta en la card,
        // pero no dispara sonido/notificación todavía.
        if (!lastAlertId) {
          localStorage.setItem(LAST_ALERT_KEY, String(alert.id))
          return
        }

        // Si cambió el ID, es alerta nueva.
        if (String(alert.id) !== lastAlertId) {
          localStorage.setItem(LAST_ALERT_KEY, String(alert.id))
          setHasNewAlert(true)

          triggerDesktopNotification(alert)
          playAlertSound()
        }
      } catch (error) {
        console.error("Error revisando alertas:", error)
        setAlertsError(error instanceof Error ? error.message : "Error revisando alertas")
      }
    }

    function playAlertSound() {
      const audio = audioRef.current
      if (!audio) return

      // Si ya está sonando, no vuelvas a reproducirla encima
      if (isPlayingRef.current) {
        console.log("El sonido ya está sonando, no se repite.")
        return
      }

      isPlayingRef.current = true
      audio.currentTime = 0

      audio.play().catch((error) => {
        isPlayingRef.current = false
        console.warn("El navegador bloqueó el sonido hasta que el usuario haga click:", error)
      })
    }

    checkAlert()
    intervalId = window.setInterval(checkAlert, 10000)

    return () => {
      window.clearInterval(intervalId)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      isPlayingRef.current = false
    }
  }, [])

  function dismissAlert() {
    setHasNewAlert(false)
  }

  return {
    latestAlert,
    hasNewAlert,
    alertsError,
    dismissAlert,
  }
}

function triggerDesktopNotification(alert: DollarAlert) {
  if (!("Notification" in window)) return

  if (Notification.permission === "granted") {
    new Notification("🚨 BANCAMIGA detectado", {
      body: alert.message_text,
      icon: "/icon.svg",
    })
  }

  if (Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("🚨 BANCAMIGA detectado", {
          body: alert.message_text,
          icon: "/icon.svg",
        })
      }
    })
  }
}