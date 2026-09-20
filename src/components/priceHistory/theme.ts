import type { PriceChartRange, PriceSource } from "../../types/prices"

/**
 * Paleta del historial de precios.
 *
 * Se mantiene la identidad oscura de VeneCambio: fondo casi negro,
 * superficies apenas más claras y bordes muy sutiles. El color solo
 * aparece donde aporta información.
 */
export const COLORS = {
  background: "#0a0c11",
  surface: "#12151c",
  surfaceSoft: "#161a22",
  border: "#232833",
  borderSoft: "#1c212a",
  text: "#e9ebf0",
  textMuted: "#8b93a3",
  textFaint: "#646d7d",
  up: "#34d399",
  down: "#f87171",
  grid: "#191d26",
} as const

export type SourceOption = {
  key: PriceSource
  label: string
  /** Nombre corto para el subtítulo del Price Hero. */
  pair: string
  color: string
}

/**
 * Añadir una fuente nueva es añadir una entrada aquí: los chips, el
 * gráfico y el Price Hero leen todos de esta lista.
 */
export const SOURCE_OPTIONS: SourceOption[] = [
  { key: "average", label: "Promedio", pair: "Bs/USD · Promedio", color: "#a78bfa" },
  { key: "bcv", label: "BCV", pair: "Bs/USD · BCV", color: "#38bdf8" },
  { key: "usdt", label: "USDT", pair: "Bs/USDT · Binance", color: "#a3e635" },
]

export function getSourceOption(source: PriceSource): SourceOption {
  return SOURCE_OPTIONS.find((option) => option.key === source) ?? SOURCE_OPTIONS[0]
}

/** `label` va en el selector; `long` se usa en textos descriptivos. */
export const RANGE_OPTIONS: { key: PriceChartRange; label: string; long: string }[] = [
  { key: "24h", label: "Día", long: "las últimas 24 horas" },
  { key: "7d", label: "Semana", long: "los últimos 7 días" },
  { key: "30d", label: "Mes", long: "los últimos 30 días" },
]

export function getRangeOption(range: PriceChartRange) {
  return RANGE_OPTIONS.find((option) => option.key === range) ?? RANGE_OPTIONS[0]
}
