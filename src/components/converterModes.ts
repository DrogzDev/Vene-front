/**
 * Tipos y constantes del conversor.
 *
 * Viven fuera de ConverterCard.tsx porque ese archivo debe exportar
 * solo componentes: mezclar componentes y constantes en un mismo módulo
 * rompe el Fast Refresh de Vite en desarrollo.
 */

export type ConverterMode = "USD" | "EUR" | "USDT" | "AVERAGE" | "CUSTOM"

export const CONVERTER_MODES: { key: ConverterMode; label: string }[] = [
  { key: "USD", label: "Dólar" },
  { key: "EUR", label: "Euro" },
  { key: "USDT", label: "USDT" },
  { key: "AVERAGE", label: "Promedio" },
  { key: "CUSTOM", label: "Personalizada" },
]

export type ConverterRates = {
  usdRate: number
  eurRate: number
  usdtRate: number
  averageRate: number
}

export const CUSTOM_RATE_STORAGE_KEY = "vex_custom_rate"
