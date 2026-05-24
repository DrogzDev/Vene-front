import { useEffect, useState } from "react"
import type { DollarAlert } from "../services/alerts"
import { getLatestAlert } from "../services/alerts"

const LAST_ALERT_KEY = "last_bancamiga_alert_id"

export function useDollarAlerts() {
  const [latestAlert, setLatestAlert] = useState<DollarAlert | null>(null)
  const [hasNewAlert, setHasNewAlert] = useState(false)
  const [alertsError, setAlertsError] = useState("")

  useEffect(() => {
    let intervalId: number

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

    checkAlert()
    intervalId = window.setInterval(checkAlert, 10000)

    return () => {
      window.clearInterval(intervalId)
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

function playAlertSound() {
  const audio = new Audio("/sounds/bancamiga-alert.mp3")
  audio.volume = 0.85

  audio.play().catch((error) => {
    console.warn("El navegador bloqueó el sonido hasta que el usuario haga click:", error)
  })
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