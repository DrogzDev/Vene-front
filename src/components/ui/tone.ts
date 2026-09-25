/**
 * Tono de la DIRECCIÓN del movimiento de un precio, compartido por
 * badges, sparklines, métricas y eventos. Convención estándar: sube →
 * verde, baja → rojo. El impacto sobre el bolívar va en un indicador
 * aparte. Ver PRICE en priceHistory/theme.ts.
 */

export type Tone = "up" | "down" | "neutral"

export function toneOf(value: number | null | undefined): Tone {
  if (value == null || value === 0) return "neutral"
  return value > 0 ? "up" : "down"
}

export const TONE_TEXT: Record<Tone, string> = {
  up: "text-rise",
  down: "text-fall",
  neutral: "text-ink-muted",
}

/**
 * Color de cada tono como variable CSS (sigue el tema activo). Solo para
 * SVG y estilos en línea; lightweight-charts usa PRICE (hex).
 */
export const TONE_HEX: Record<Tone, string> = {
  up: "rgb(var(--c-positive))",
  down: "rgb(var(--c-negative))",
  neutral: "rgb(var(--c-text-secondary))",
}

/**
 * Fondo suave del mismo color (badges, chips). color-mix funciona igual
 * con un hex que con una variable CSS, al contrario que concatenar "1a".
 */
export function tint(color: string, percent = 12) {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

/** "+0,91%" / "−1,20%" con signo tipográfico real. */
export function formatSignedPercent(value: number, digits = 2) {
  // Se redondea antes de elegir el signo: -0,001 se muestra "0,00%", no "−0,00%".
  const rounded = Number(value.toFixed(digits))
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : ""
  return `${sign}${Math.abs(rounded).toFixed(digits).replace(".", ",")}%`
}
