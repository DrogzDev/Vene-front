self.addEventListener("install", function (event) {
  self.skipWaiting()
})

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", function (event) {
  let data = {
    title: "🚨 BANCAMIGA detectado",
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

  const options = {
    body: data.body,
    icon: data.icon || "/icon.svg",
    badge: data.badge || "/icon.svg",
    tag: data.alert_id ? `bancamiga-alert-${data.alert_id}` : "bancamiga-alert",
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || "/",
      alert_id: data.alert_id,
    },
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
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
            return
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})