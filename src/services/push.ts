import { getDeviceId } from "../utils/device"

const API_URL = import.meta.env.VITE_API_URL
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

const PUSH_ENABLED_KEY = "bancamiga_push_enabled"
const PUSH_ENDPOINT_KEY = "bancamiga_push_endpoint"

let subscribeInProgress = false
let unsubscribeInProgress = false

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export function isPushMarkedAsEnabled() {
  return localStorage.getItem(PUSH_ENABLED_KEY) === "true"
}

export function getSavedPushEndpoint() {
  return localStorage.getItem(PUSH_ENDPOINT_KEY)
}

export function clearSavedPushState() {
  localStorage.removeItem(PUSH_ENABLED_KEY)
  localStorage.removeItem(PUSH_ENDPOINT_KEY)
}

export async function getCurrentPushSubscription() {
  if (!("serviceWorker" in navigator)) {
    return null
  }

  await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
  })

  const registration = await navigator.serviceWorker.ready

  return registration.pushManager.getSubscription()
}

export async function isCurrentBrowserSubscribed() {
  try {
    if (!("Notification" in window)) {
      return false
    }

    if (Notification.permission !== "granted") {
      return false
    }

    const subscription = await getCurrentPushSubscription()

    if (!subscription) {
      return false
    }

    const savedEndpoint = localStorage.getItem(PUSH_ENDPOINT_KEY)

    return (
      localStorage.getItem(PUSH_ENABLED_KEY) === "true" &&
      savedEndpoint === subscription.endpoint
    )
  } catch {
    return false
  }
}

export async function subscribeToPushNotifications() {
  if (subscribeInProgress) {
    console.log("Ya hay una suscripción push en proceso. Ignorando click repetido.")

    return {
      ok: true,
      already_running: true,
    }
  }

  subscribeInProgress = true

  try {
    if (!API_URL) {
      throw new Error("Falta VITE_API_URL en el frontend.")
    }

    if (!VAPID_PUBLIC_KEY) {
      throw new Error("Falta VITE_VAPID_PUBLIC_KEY en el frontend.")
    }

    if (!("serviceWorker" in navigator)) {
      throw new Error("Este navegador no soporta service workers.")
    }

    if (!("PushManager" in window)) {
      throw new Error("Este navegador no soporta push notifications.")
    }

    if (!("Notification" in window)) {
      throw new Error("Este navegador no soporta notificaciones.")
    }

    const permission = await Notification.requestPermission()

    if (permission !== "granted") {
      clearSavedPushState()
      throw new Error("El usuario no aceptó las notificaciones.")
    }

    await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    })

    const registration = await navigator.serviceWorker.ready

    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      } catch (error) {
        console.error("Error creando PushSubscription:", error)

        clearSavedPushState()

        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error(
            "El navegador bloqueó el servicio push. Si usas Brave, prueba con Chrome o Edge."
          )
        }

        throw error
      }
    }

    const subscriptionJson = subscription.toJSON()
    const endpoint = subscriptionJson.endpoint || ""
    const p256dh = subscriptionJson.keys?.p256dh
    const auth = subscriptionJson.keys?.auth

    if (!endpoint || !p256dh || !auth) {
      clearSavedPushState()
      throw new Error("La suscripción push está incompleta.")
    }

    const savedEndpoint = localStorage.getItem(PUSH_ENDPOINT_KEY)
    const alreadyEnabled = localStorage.getItem(PUSH_ENABLED_KEY) === "true"

    if (alreadyEnabled && savedEndpoint === endpoint) {
      console.log("Push ya estaba registrado en este navegador. No se manda POST.")

      return {
        ok: true,
        already_subscribed: true,
        endpoint,
      }
    }

    console.log("SUBSCRIPTION REAL:", subscriptionJson)

    const response = await fetch(`${API_URL}/alerts/push/subscribe/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint,
        keys: {
          p256dh,
          auth,
        },
        device_id: getDeviceId(),
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      console.error("ERROR BACKEND PUSH:", result)
      clearSavedPushState()
      throw new Error(result.error || "Error guardando suscripción push.")
    }

    localStorage.setItem(PUSH_ENABLED_KEY, "true")
    localStorage.setItem(PUSH_ENDPOINT_KEY, endpoint)

    console.log("SUBSCRIPTION GUARDADA:", result)

    return result
  } finally {
    subscribeInProgress = false
  }
}

export async function unsubscribeFromPushNotifications() {
  if (unsubscribeInProgress) {
    console.log("Ya hay una desactivación push en proceso.")

    return {
      ok: true,
      already_running: true,
    }
  }

  unsubscribeInProgress = true

  try {
    if (!API_URL) {
      clearSavedPushState()
      throw new Error("Falta VITE_API_URL en el frontend.")
    }

    if (!("serviceWorker" in navigator)) {
      clearSavedPushState()

      return {
        ok: true,
        reason: "service_worker_not_supported",
      }
    }

    await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    })

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      clearSavedPushState()

      return {
        ok: true,
        reason: "no_subscription_found",
      }
    }

    const endpoint = subscription.endpoint

    const response = await fetch(`${API_URL}/alerts/push/unsubscribe/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint,
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      console.error("ERROR BACKEND PUSH UNSUBSCRIBE:", result)
      throw new Error(result.error || "Error desactivando suscripción push.")
    }

    await subscription.unsubscribe()

    clearSavedPushState()

    console.log("Push subscription desactivada:", result)

    return result
  } finally {
    unsubscribeInProgress = false
  }
}