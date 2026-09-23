import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"

import { notificationService } from "../../services/notifications"

/**
 * Conecta los toques en notificaciones (SW web o FCM nativo) con el
 * router. Vive dentro de BrowserRouter y no pinta nada.
 *
 * init() se ejecuta UNA vez por sesión: `navigate` cambia de identidad en
 * cada navegación, y si fuera dependencia del efecto se volverían a
 * crear los listeners y a registrar el push en cada cambio de pantalla.
 */
export default function NotificationRouteBridge() {
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)

  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  useEffect(() => notificationService.init((route) => navigateRef.current(route)), [])

  return null
}
