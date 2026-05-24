import { getDeviceId } from "../utils/device"

const API_URL = import.meta.env.VITE_API_URL

export type DollarAlert = {
  id: number
  alert_type: string
  source: string
  group_username: string
  telegram_message_id: number
  message_text: string
  telegram_sent_at_utc: string
  telegram_sent_at_ve: string
  telegram_sent_at_ve_pretty: string
  detected_at: string
  detected_at_ve: string
  detected_at_ve_pretty: string
  is_read: boolean
}

export async function getAlerts(limit = 5) {
  const deviceId = getDeviceId()

  const response = await fetch(
    `${API_URL}/alerts/?limit=${limit}&device_id=${deviceId}`
  )

  if (!response.ok) {
    throw new Error("Error cargando alertas")
  }

  const result = await response.json()

  if (!result.ok) {
    throw new Error(result.error || "Error cargando alertas")
  }

  return {
    alerts: result.data as DollarAlert[],
    unreadCount: result.unread_count as number,
  }
}

export async function getLatestAlert() {
  const deviceId = getDeviceId()

  const response = await fetch(
    `${API_URL}/alerts/latest/?device_id=${deviceId}`
  )

  if (!response.ok) {
    throw new Error("Error cargando última alerta")
  }

  const result = await response.json()

  if (!result.ok) {
    throw new Error(result.error || "Error cargando última alerta")
  }

  return result.data as DollarAlert | null
}

export async function markAlertsRead(alertIds: number[]) {
  const deviceId = getDeviceId()

  const response = await fetch(`${API_URL}/alerts/mark-read/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      device_id: deviceId,
      alert_ids: alertIds,
    }),
  })

  if (!response.ok) {
    throw new Error("Error marcando alertas como leídas")
  }

  const result = await response.json()

  if (!result.ok) {
    throw new Error(result.error || "Error marcando alertas como leídas")
  }

  return result
}