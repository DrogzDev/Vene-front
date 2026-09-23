import type { CSSProperties } from "react"

import aiVenecambio from "../../assets/venecambio-ui-icons/ai-venecambio.svg"
import alertBank from "../../assets/venecambio-ui-icons/alert-bank.svg"
import convertSwap from "../../assets/venecambio-ui-icons/convert-swap.svg"
import currencyAverage from "../../assets/venecambio-ui-icons/currency-average.svg"
import currencyBcv from "../../assets/venecambio-ui-icons/currency-bcv.svg"
import currencyEuro from "../../assets/venecambio-ui-icons/currency-euro.svg"
import currencyUsa from "../../assets/venecambio-ui-icons/currency-usa.svg"
import currencyUsdt from "../../assets/venecambio-ui-icons/currency-usdt.svg"
import currencyVenezuela from "../../assets/venecambio-ui-icons/currency-venezuela.svg"
import historyRing from "../../assets/venecambio-ui-icons/history-ring.svg"
import marketAnalysis from "../../assets/venecambio-ui-icons/market-analysis.svg"
import marketCandles from "../../assets/venecambio-ui-icons/market-candles.svg"
import periodEvents from "../../assets/venecambio-ui-icons/period-events.svg"
import trendAnalysis from "../../assets/venecambio-ui-icons/trend-analysis.svg"

/*
 * Iconos propios de VeneCambio (monedas, mercado, IA, historial...).
 *
 * Los SVG viven en src/assets/venecambio-ui-icons/. La carpeta
 * equivalente dentro de android/ es la copia que genera Capacitor desde
 * dist/: nunca se importa desde allí.
 *
 * Hay dos familias:
 * - Monocromos (trazo con currentColor): se pintan con una máscara CSS
 *   sobre `bg-current`, así heredan el color del texto como un icono de
 *   Lucide. Un <img> perdería currentColor.
 * - Monedas (multicolor, fills fijos): van como <img>.
 *
 * Chevrons, cerrar, copiar, calendario, etc. siguen siendo Lucide.
 */

const MONO = {
  ai: aiVenecambio,
  "alert-bank": alertBank,
  "convert-swap": convertSwap,
  "history-ring": historyRing,
  "market-analysis": marketAnalysis,
  "market-candles": marketCandles,
  "period-events": periodEvents,
  "trend-analysis": trendAnalysis,
} as const

const CURRENCY = {
  ves: currencyVenezuela,
  usd: currencyUsa,
  eur: currencyEuro,
  usdt: currencyUsdt,
  bcv: currencyBcv,
  average: currencyAverage,
} as const

export type VcIconName = keyof typeof MONO
export type CurrencyIconName = keyof typeof CURRENCY

/** Icono monocromo que toma el color del texto (`text-*`). */
export function VcIcon({ name, className = "h-5 w-5" }: { name: VcIconName; className?: string }) {
  const mask = `url("${MONO[name]}") center / contain no-repeat`
  const style: CSSProperties = { mask, WebkitMask: mask }

  return <span aria-hidden className={`inline-block shrink-0 bg-current ${className}`} style={style} />
}

/** Icono de moneda o tasa, a todo color. */
export function CurrencyIcon({ name, className = "h-7 w-7" }: { name: CurrencyIconName; className?: string }) {
  return (
    <img
      src={CURRENCY[name]}
      alt=""
      aria-hidden
      draggable={false}
      className={`inline-block shrink-0 select-none ${className}`}
    />
  )
}
