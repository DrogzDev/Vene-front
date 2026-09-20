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

export function trendColor(trend: P2PTrend) {
  if (trend === "bullish") return "#34d399"
  if (trend === "bearish") return "#f87171"
  return "#8b93a3"
}

export function riskColor(risk: P2PRiskLevel) {
  if (risk === "low") return "#34d399"
  if (risk === "normal") return "#8b93a3"
  return "#f87171"
}
