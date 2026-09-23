import type { PriceChartRange, PriceSource } from "../../types/prices"

/**
 * Paleta compartida, en su versión JavaScript.
 *
 * Los mismos valores viven en `tailwind.config.js` como tokens. Esta
 * copia existe porque hay consumidores que no pueden leer una clase de
 * Tailwind: lightweight-charts recibe los colores como strings en su
 * configuración, y varios componentes los aplican con `style` en línea.
 *
 * Los dos archivos se mueven juntos. Si cambias un color aquí y no
 * allí, la gráfica y la tarjeta que la rodea dejan de pegar.
 */
export const COLORS = {
  background: "#06080C",
  surface: "#0E131B",
  surfaceRaised: "#141A24",
  surfaceSoft: "#1A212C",
  border: "rgba(255, 255, 255, 0.06)",
  borderSoft: "rgba(255, 255, 255, 0.05)",
  brand: "#7C5CFF",
  text: "#F5F7FA",
  textSoft: "#C3CBD6",
  textMuted: "#8E9AAA",
  textFaint: "#5E6B7B",
  up: "#20D6A0",
  down: "#FF5D69",
  info: "#3AA8FF",
  // Rejilla del gráfico: visible lo justo para leer niveles.
  grid: "rgba(255, 255, 255, 0.05)",
} as const

/**
 * Color de la DIRECCIÓN del movimiento del mercado (tokens `rise` y
 * `fall` de Tailwind), con la convención financiera estándar: sube →
 * verde, baja → rojo, también en las velas.
 *
 * Es deliberado separar esto del impacto cambiario: que USDT/VES suba
 * se pinta verde como movimiento del mercado, y aparte se indica que el
 * bolívar se debilita. Así queda explícito desde qué perspectiva se lee
 * cada color.
 */
export const PRICE = {
  rise: COLORS.up,
  fall: COLORS.down,
} as const

/** Color para una variación: >0 sube (verde), <0 baja (rojo), 0/null neutro. */
export function priceChangeColor(change: number | null | undefined, neutral: string = COLORS.textMuted) {
  if (change == null || change === 0) return neutral
  return change > 0 ? PRICE.rise : PRICE.fall
}

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
  { key: "average", label: "Promedio", pair: "Bs/USD · Promedio", color: "#7C5CFF" },
  { key: "bcv", label: "BCV", pair: "Bs/USD · BCV", color: "#3AA8FF" },
  { key: "usdt", label: "USDT", pair: "Bs/USDT · Binance", color: "#20D6A0" },
  { key: "eur", label: "Euro", pair: "Bs/EUR · BCV", color: "#2DD4E6" },
]

export function getSourceOption(source: PriceSource): SourceOption {
  return SOURCE_OPTIONS.find((option) => option.key === source) ?? SOURCE_OPTIONS[0]
}

/** `label` va en el selector; `long` se usa en textos descriptivos. */
export const RANGE_OPTIONS: { key: PriceChartRange; label: string; long: string }[] = [
  { key: "24h", label: "Hoy", long: "las últimas 24 horas" },
  { key: "7d", label: "7D", long: "los últimos 7 días" },
  { key: "30d", label: "30D", long: "los últimos 30 días" },
  { key: "90d", label: "90D", long: "los últimos 90 días" },
]

export function getRangeOption(range: PriceChartRange) {
  return RANGE_OPTIONS.find((option) => option.key === range) ?? RANGE_OPTIONS[0]
}
