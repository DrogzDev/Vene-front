self.addEventListener("install", function () {
  self.skipWaiting()
})

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", function (event) {
  let data = {
    title: "🚨 Alerta bancaria detectada",
    body: "Nueva alerta disponible.",
    icon: "/icon.svg",
    badge: "/icon.svg",
    url: "/",
    alert_id: null,
  }

  try {
    if (event.data) {
      data = {
        ...data,
        ...event.data.json(),
      }
    }
  } catch (error) {
    console.error("Error leyendo data del push:", error)
  }

  event.waitUntil(
    (async function () {
      const clientList = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      })

      for (const client of clientList) {
        client.postMessage({
          type: "BANK_ALERT_PUSH_RECEIVED",
          payload: data,
        })
      }

      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || "/icon.svg",
        badge: data.badge || "/icon.svg",
        tag: data.alert_id ? `bank-alert-${data.alert_id}` : "bank-alert",
        renotify: true,
        requireInteraction: true,
        data: {
          url: data.url || "/",
          alert_id: data.alert_id,
        },
      })
    })()
  )
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()

  const url = event.notification.data?.url || "/"

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus()

            client.postMessage({
              type: "BANK_ALERT_NOTIFICATION_CLICKED",
              payload: event.notification.data,
            })

            return
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})