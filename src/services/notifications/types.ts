export type PushState = "unsupported" | "denied" | "disabled" | "enabled"

export type OpenRouteHandler = (route: string) => void

/**
 * Contrato común de los transportes de push. La UI solo habla con esto;
 * no sabe si debajo hay Web Push (VAPID) o FCM nativo.
 */
export interface NotificationAdapter {
  platform: "web" | "android"

  /**
   * En web, las alertas de precio llegan por la MISMA suscripción que
   * las alertas bancarias (alerts.PushSubscription). La UI lo necesita
   * saber para no mostrar dos interruptores que en realidad son uno.
   */
  sharesBankAlertsSubscription: boolean

  getState(): Promise<PushState>
  enable(): Promise<void>
  disable(): Promise<void>

  /** Se llama al arrancar la app. Devuelve la limpieza de listeners. */
  init(onOpenRoute: OpenRouteHandler): () => void
}

/** Evento de ventana que avisa a las pantallas de alertas que hubo un disparo. */
export const PRICE_ALERT_RECEIVED_EVENT = "vex:price-alert-received"

/** Alerta bancaria recibida por FCM con la app abierta (solo APK). */
export const BANK_ALERT_RECEIVED_EVENT = "vex:bank-alert-received"

/**
 * Solo rutas internas de la app. Un payload de push nunca debe poder
 * mandar al WebView a un dominio externo.
 */
export function safeInternalRoute(route: unknown): string | null {
  if (typeof route !== "string") return null
  if (!route.startsWith("/") || route.startsWith("//")) return null

  return route
}
