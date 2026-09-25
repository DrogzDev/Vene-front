import type { PriceChartRange, PriceSource } from "../../types/prices"

/**
 * Paleta compartida, en su versión JavaScript.
 *
 * Los colores de la interfaz viven en src/styles/tokens.css (temas dark
 * y light). Esta copia en hex existe porque lightweight-charts dibuja en
 * un canvas y necesita strings de color reales: no entiende var(--…).
 * Refleja el tema dark, que es el principal.
 *
 * Para SVG o estilos en línea, usa `CSS_COLORS`: siguen el tema activo.
 */
export const COLORS = {
  background: "#050607",
  surface: "#0D1014",
  surfaceRaised: "#11151A",
  surfaceSoft: "#171B20",
  border: "#20252B",
  borderSoft: "#1A1E23",
  gold: "#C9A86A",
  text: "#F7F7F5",
  textSoft: "#D3D6DA",
  textMuted: "#A0A6AE",
  textFaint: "#69717C",
  up: "#14CFA8",
  down: "#FF5B65",
  info: "#3AA8FF",
  // Rejilla del gráfico: visible lo justo para leer niveles.
  grid: "rgba(255, 255, 255, 0.05)",
} as const

/** Los mismos colores como variables CSS: cambian solos con el tema. */
export const CSS_COLORS = {
  gold: "rgb(var(--c-gold))",
  teal: "rgb(var(--c-teal))",
  info: "rgb(var(--c-info))",
  positive: "rgb(var(--c-positive))",
  negative: "rgb(var(--c-negative))",
  textMuted: "rgb(var(--c-text-secondary))",
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
  { key: "usdt", label: "USDT", pair: "Bs/USDT · Binance", color: "#10C7B0" },
  { key: "bcv", label: "BCV", pair: "Bs/USD · BCV", color: "#3AA8FF" },
  { key: "eur", label: "Euro", pair: "Bs/EUR · BCV", color: "#2DD4E6" },
  { key: "average", label: "Promedio", pair: "Bs/USD · Promedio", color: "#C9A86A" },
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
