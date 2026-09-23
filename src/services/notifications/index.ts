import { Capacitor } from "@capacitor/core"

import { androidFcmAdapter } from "./androidFcmAdapter"
import { webPushAdapter } from "./webPushAdapter"
import type { NotificationAdapter } from "./types"

/**
 * Punto único de entrada para el push:
 * - APK (Capacitor Android) → FCM nativo.
 * - Navegador / PWA → Web Push VAPID existente.
 */
export const notificationService: NotificationAdapter =
  Capacitor.getPlatform() === "android" ? androidFcmAdapter : webPushAdapter

export { BANK_ALERT_RECEIVED_EVENT, PRICE_ALERT_RECEIVED_EVENT } from "./types"
export type { PushState } from "./types"
export { isPriceAlertPayload } from "./webPushAdapter"
