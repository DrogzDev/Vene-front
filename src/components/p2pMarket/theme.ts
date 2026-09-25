import type { BolivarOutlook, P2PRiskLevel, P2PTrend, P2PVolatility } from "../../types/prices"
import { TONE_HEX } from "../ui/tone"

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
  return TONE_HEX[trend === "bullish" ? "up" : trend === "bearish" ? "down" : "neutral"]
}

/**
 * Lectura para quien tiene bolívares. Sustituye al "riesgo" por
 * volatilidad en la interfaz: una tendencia alcista no es "riesgo bajo"
 * para quien tiene bolívares, es un mal momento para tenerlos.
 */
export const BOLIVAR_OUTLOOK_LABELS: Record<BolivarOutlook, string> = {
  unfavorable: "Mal momento para tener bolívares",
  neutral: "Momento neutral para el bolívar",
  // La jornada y la última hora se contradicen: sin lectura fuerte.
  mixed: "Señales mixtas para el bolívar",
  favorable: "Buen momento para tener bolívares",
  // Antes de que empiece la oferta bancaria: la fortaleza puede no durar.
  favorable_temporary: "Bolívar favorecido temporalmente",
}

/** Debilidad del bolívar en rojo, recuperación en verde, neutral en gris. */
export function bolivarOutlookColor(outlook: BolivarOutlook) {
  if (outlook === "unfavorable") return TONE_HEX.down
  if (outlook === "favorable" || outlook === "favorable_temporary") return TONE_HEX.up
  return TONE_HEX.neutral
}

export function riskColor(risk: P2PRiskLevel) {
  return TONE_HEX[risk === "low" ? "up" : risk === "normal" ? "neutral" : "down"]
}
