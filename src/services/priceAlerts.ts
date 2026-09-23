import { getDeviceId } from "../utils/device"
import { formatBs } from "../utils/format"

const API_BASE = import.meta.env.VITE_API_URL

export type PriceAlertSource = "USDT" | "BCV" | "AVERAGE"
export type PriceAlertOperator = "GTE" | "LTE"
export type PriceAlertFrequency = "ONCE" | "REPEAT"
export type PriceAlertStatus = "ACTIVE" | "PAUSED" | "TRIGGERED"

/**
 * Los montos viajan SIEMPRE como string decimal ("970.00"): el backend
 * los guarda como Decimal y aquí nunca pasan por un float.
 */
export type PriceAlert = {
  id: number
  source: PriceAlertSource
  operator: PriceAlertOperator
  target_price: string
  frequency: PriceAlertFrequency
  push_enabled: boolean
  use_market_context: boolean
  cooldown_minutes: number
  is_active: boolean
  status: PriceAlertStatus
  current_price: string | null
  current_price_at: string | null
  trigger_count: number
  triggered_at: string | null
  last_triggered_at: string | null
  created_at: string
  updated_at: string
}

export type PriceAlertInput = {
  source: PriceAlertSource
  operator: PriceAlertOperator
  target_price: string
  frequency: PriceAlertFrequency
  push_enabled: boolean
  use_market_context: boolean
}

export type PriceAlertTrigger = {
  id: number
  alert_id: number
  source: PriceAlertSource
  operator: PriceAlertOperator
  price: string
  target_price: string
  triggered_at: string
  notification_status: "PENDING" | "SENT" | "FAILED" | "NO_RECIPIENTS" | "SKIPPED" | "EXPIRED"
  notification_sent: boolean
  notification_sent_at: string | null
}

export type CurrentPrice = { price: string; observed_at: string | null } | null

export type CurrentPricesResponse = {
  prices: Record<PriceAlertSource, CurrentPrice>
  limits: { max_active_alerts: number; default_cooldown_minutes: number }
}

export class PriceAlertsError extends Error {
  status: number
  fieldErrors: Record<string, string[]>

  constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.name = "PriceAlertsError"
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

function firstMessage(data: unknown): { message: string; fields: Record<string, string[]> } {
  if (!data || typeof data !== "object") {
    return { message: "No se pudo completar la operación.", fields: {} }
  }

  const record = data as Record<string, unknown>

  if (typeof record.detail === "string") {
    return { message: record.detail, fields: {} }
  }

  const fields: Record<string, string[]> = {}

  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) fields[key] = value.map(String)
    else if (typeof value === "string") fields[key] = [value]
  }

  const first = Object.values(fields)[0]?.[0]

  return { message: first ?? "Revisa los datos de la alerta.", fields }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE) {
    throw new PriceAlertsError("Falta VITE_API_URL en el frontend.", 0)
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        // La única identidad de la app: nunca se manda un dueño en el body.
        "X-Device-ID": getDeviceId(),
        ...(init.headers ?? {}),
      },
    })
  } catch {
    throw new PriceAlertsError("Sin conexión con el servidor.", 0)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const { message, fields } = firstMessage(data)
    throw new PriceAlertsError(message, response.status, fields)
  }

  return data as T
}

export function listPriceAlerts() {
  return request<PriceAlert[]>("/price-alerts/")
}

export function createPriceAlert(input: PriceAlertInput) {
  return request<PriceAlert>("/price-alerts/", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updatePriceAlert(id: number, input: Partial<PriceAlertInput>) {
  return request<PriceAlert>(`/price-alerts/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export function deletePriceAlert(id: number) {
  return request<void>(`/price-alerts/${id}/`, { method: "DELETE" })
}

export function togglePriceAlert(id: number) {
  return request<PriceAlert>(`/price-alerts/${id}/toggle/`, { method: "POST" })
}

export function getPriceAlertHistory(limit = 50) {
  return request<{ count: number; results: PriceAlertTrigger[] }>(
    `/price-alerts/history/?limit=${limit}`,
  )
}

export function getAlertCurrentPrices() {
  return request<CurrentPricesResponse>("/price-alerts/current-prices/")
}

/**
 * "970,5" / "970.50" / "1.234,56" → "970.50" / "1234.56".
 * Devuelve null si no es un monto válido. Trabaja sobre el texto, sin
 * convertir a float, para no introducir errores de redondeo.
 */
export function parseAmountInput(raw: string): string | null {
  const cleaned = raw.replace(/\s|Bs/gi, "")

  if (!cleaned) return null

  let normalized = cleaned

  if (cleaned.includes(",")) {
    // Formato venezolano: el punto es separador de miles.
    normalized = cleaned.replace(/\./g, "").replace(",", ".")
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null

  const [integer, decimals = ""] = normalized.split(".")
  const trimmedInteger = integer.replace(/^0+(?=\d)/, "")

  if (Number(trimmedInteger) === 0 && /^0*$/.test(decimals)) return null

  return `${trimmedInteger}.${decimals.padEnd(2, "0")}`
}

/** "970.00" → "970,00". Solo para mostrar: lo que se envía es el string. */
export function formatAmount(decimal: string) {
  return formatBs(Number(decimal))
}
