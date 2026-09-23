import type { P2PRiskLevel, P2PTrend, P2PVolatility } from "../../types/prices"

// Reutiliza la paleta base del historial de precios: misma identidad
// oscura, mismos verdes/rojos con significado, sin inventar una
// segunda paleta para la Vista Profesional.
export { COLORS } from "../priceHistory/theme"

export const TREND_LABELS: Record<P2PTrend, string> = {
  bullish: "Alcista",
  neutral: "Neutral",
  bearish: "Bajista",
}

export const VOLATILITY_LABELS: Record<P2PVolatility, string> = {
  low: "Baja",
  moderate: "Moderada",
  high: "Alta",
}

export const RISK_LABELS: Record<P2PRiskLevel, string> = {
  low: "Bajo",
  normal: "Normal",
  elevated: "Elevado",
  high: "Alto",
}

/** Tendencia del mercado USDT/VES: alcista verde, bajista roja (ver PRICE). */
export function trendColor(trend: P2PTrend) {
  if (trend === "bullish") return "#20D6A0"
  if (trend === "bearish") return "#FF5D69"
  return "#8B98A8"
}

export function riskColor(risk: P2PRiskLevel) {
  if (risk === "low") return "#20D6A0"
  if (risk === "normal") return "#8B98A8"
  return "#FF5D69"
}
