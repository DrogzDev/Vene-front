import {
  isCurrentBrowserSubscribed,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "../push"
import {
  PRICE_ALERT_RECEIVED_EVENT,
  safeInternalRoute,
  type NotificationAdapter,
  type PushState,
} from "./types"

/** Las alertas de precio web llevan alert_id "price-<trigger_id>". */
export function isPriceAlertPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return false

  const record = payload as Record<string, unknown>

  return (
    record.type === "PRICE_ALERT" ||
    (typeof record.alert_id === "string" && record.alert_id.startsWith("price-"))
  )
}

function routeFromUrl(url: unknown) {
  if (typeof url !== "string") return null

  try {
    const parsed = new URL(url, window.location.origin)

    return safeInternalRoute(`${parsed.pathname}${parsed.search}`)
  } catch {
    return null
  }
}

/**
 * Web Push con VAPID, tal como ya funciona para las alertas bancarias.
 *
 * No se toca public/sw.js: el SW ya reenvía a la pestaña abierta
 * BANK_ALERT_PUSH_RECEIVED y BANK_ALERT_NOTIFICATION_CLICKED con el
 * payload. Aquí solo se distinguen los de alertas de precio.
 */
export const webPushAdapter: NotificationAdapter = {
  platform: "web",
  sharesBankAlertsSubscription: true,

  async getState(): Promise<PushState> {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return "unsupported"
    }

    if (Notification.permission === "denied") return "denied"

    return (await isCurrentBrowserSubscribed()) ? "enabled" : "disabled"
  },

  async enable() {
    // Siempre manda device_id: así las alertas de precio de este
    // dispositivo encuentran su PushSubscription.
    await subscribeToPushNotifications()
  },

  async disable() {
    await unsubscribeFromPushNotifications()
  },

  init(onOpenRoute) {
    if (!("serviceWorker" in navigator)) return () => {}

    function handleMessage(event: MessageEvent) {
      const message = event.data
      const payload = message?.payload

      if (!isPriceAlertPayload(payload)) return

      if (message.type === "BANK_ALERT_PUSH_RECEIVED") {
        window.dispatchEvent(new CustomEvent(PRICE_ALERT_RECEIVED_EVENT))
        return
      }

      if (message.type === "BANK_ALERT_NOTIFICATION_CLICKED") {
        const route = routeFromUrl(payload.url)

        if (route) onOpenRoute(route)
      }
    }

    navigator.serviceWorker.addEventListener("message", handleMessage)

    return () => navigator.serviceWorker.removeEventListener("message", handleMessage)
  },
}
