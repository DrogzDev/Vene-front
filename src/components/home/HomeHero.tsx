import { useLayoutEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { History } from "lucide-react"

import type { PriceSource, PricesHomeData } from "../../types/prices"
import { formatDate, formatRelativeFromNow } from "../../utils/format"
import { EASE, gsap, withMotion } from "../../motion/motion"
import { useCrossfade } from "../../motion/useCrossfade"
import { COLORS } from "../priceHistory/theme"
import AnimatedPrice from "../ui/AnimatedPrice"
import PeriodChips from "../ui/PeriodChips"
import Sparkline from "../ui/Sparkline"
import { TrendBadge } from "../ui/primitives"
import type { HomeMarket } from "./useHomeMarket"
import type { HomeRateMode } from "./homeRates"
import { useIntradaySeries } from "./useIntradaySeries"

type Period = "24h" | "7d" | "30d"

type Props = {
  mode: HomeRateMode
  data: PricesHomeData
  market: Pick<HomeMarket, "series" | "selectedDate" | "usingCache" | "cachedAt" | "clearHistoricalView">
}

const MODE_INFO: Record<HomeRateMode, { title: string; pair: string; source: PriceSource; key: "bcv" | "eur" | "usdt" | "average" }> = {
  USD: { title: "Dólar BCV", pair: "Bs/USD", source: "bcv", key: "bcv" },
  EUR: { title: "Euro BCV", pair: "Bs/EUR", source: "eur", key: "eur" },
  USDT: { title: "USDT", pair: "Binance P2P", source: "usdt", key: "usdt" },
  AVERAGE: { title: "Promedio", pair: "BCV + Binance", source: "average", key: "average" },
}

const PERIOD_DAYS: Record<Exclude<Period, "24h">, number> = { "7d": 7, "30d": 30 }

/** "YYYY-MM-DD" de hace N días, en calendario de Venezuela. */
function cutoffDate(days: number) {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(date)
}

/**
 * Valores cuya fecha cae dentro del período. Por fecha y no por
 * cantidad: los cierres tienen huecos, y "los últimos 30 cierres"
 * podría abarcar dos meses.
 */
function withinDays(dates: string[], values: number[], days: number, anchor: string | null) {
  const cutoff = anchor ?? cutoffDate(days)

  return values.filter((_, index) => (dates[index] ?? "") >= cutoff)
}

function anchorFor(selectedDate: Date | null, days: number) {
  if (!selectedDate) return null

  const from = new Date(selectedDate.getTime() - days * 24 * 60 * 60 * 1000)
  return format(from, "yyyy-MM-dd")
}

function valueOf(mode: HomeRateMode, data: PricesHomeData) {
  if (mode === "USD") return data.bcv.USD
  if (mode === "EUR") return data.bcv.EUR
  if (mode === "USDT") return data.binance_best_price
  return data.average_price
}

/** Variación entre el primer y el último valor REAL de la ventana. */
function windowChange(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0)

  if (clean.length < 2) return null

  return ((clean[clean.length - 1] - clean[0]) / clean[0]) * 100
}

/**
 * Tasa protagonista de Inicio (~170 px en 360 px de ancho).
 *
 * Una sola composición, sin card dentro de card: par → precio y
 * variación → antigüedad → gráfico → 24H/7D/30D. 7D y 30D salen de los
 * cierres que Inicio ya cargó; 24H se pide solo al tocarlo. Con menos
 * de 3 puntos no se dibuja nada.
 *
 * El gráfico va siempre en violeta (color de la UI); el verde y el rojo
 * quedan para la variación, que es donde significan algo.
 */
export default function HomeHero({ mode, data, market }: Props) {
  const [period, setPeriod] = useState<Period>("7d")

  const priceRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<HTMLDivElement | null>(null)

  const info = MODE_INFO[mode]
  const historical = market.selectedDate !== null
  // En una fecha histórica no hay "últimas 24 h" que mostrar.
  const activePeriod: Period = historical && period === "24h" ? "7d" : period

  const intraday = useIntradaySeries(info.source, activePeriod === "24h")

  const values =
    activePeriod === "24h"
      ? (intraday ?? [])
      : withinDays(
          market.series.dates,
          market.series[info.key],
          PERIOD_DAYS[activePeriod],
          anchorFor(market.selectedDate, PERIOD_DAYS[activePeriod]),
        )

  const change = windowChange(values)
  const hasChart = values.filter((value) => Number.isFinite(value) && value > 0).length >= 3

  const periodLabel = activePeriod === "24h" ? "24h" : activePeriod === "7d" ? "7D" : "30D"

  // Otra tasa: el precio entra de nuevo (sin interpolar de una tasa a otra).
  useCrossfade(priceRef, mode, { fromOpacity: 0, y: 6 })
  // Otro período u otra tasa: transición breve del gráfico, no de la página.
  useCrossfade(chartRef, `${mode}-${activePeriod}`)

  // Al llegar a Inicio el gráfico se "dibuja" de izquierda a derecha.
  // Es un recorte del contenedor: el SVG no se toca.
  useLayoutEffect(() => {
    const chart = chartRef.current

    if (!chart) return

    return withMotion(chart, () => {
      gsap.fromTo(
        chart,
        { clipPath: "inset(0 100% 0 0)" },
        { clipPath: "inset(0 0% 0 0)", duration: 0.5, delay: 0.12, ease: EASE.out, clearProps: "clipPath" },
      )
    })
  }, [])

  return (
    <section
      aria-label="Tasa principal"
      className="-mx-4 bg-hero px-4 pb-1 pt-3 sm:mx-0 sm:rounded-card sm:px-4"
    >
      <p data-enter className="truncate text-[13px] font-semibold text-ink-soft">
        {info.title}
        <span className="ml-1.5 font-medium text-ink-faint">{info.pair}</span>
      </p>

      <div data-enter className="mt-1.5 flex items-end justify-between gap-3">
        <div key={mode} ref={priceRef} className="min-w-0">
          <AnimatedPrice value={valueOf(mode, data)} size="xl" />
        </div>
        <div className="pb-1">
          <TrendBadge value={change} suffix={periodLabel} size="sm" />
        </div>
      </div>

      <p data-enter className="mt-1.5 truncate text-[12px] text-ink-muted">
        {historical && market.selectedDate ? (
          <>Cierre del {format(market.selectedDate, "d MMM yyyy", { locale: es })}</>
        ) : market.usingCache ? (
          <span className="text-warn">
            Guardado{market.cachedAt ? ` · ${formatDate(market.cachedAt)}` : ""}
          </span>
        ) : (
          <>Actualizado {formatRelativeFromNow(data.updated_at)}</>
        )}
      </p>

      <div data-enter>
        <div ref={chartRef} className="mt-2 h-14">
          {hasChart ? (
            <Sparkline values={values} color={COLORS.brand} width={300} height={56} fill fluid />
          ) : (
            <p className="flex h-full items-center text-[12px] text-ink-faint">
              {activePeriod === "24h" && intraday === undefined ? "Cargando…" : "Sin datos suficientes para este período."}
            </p>
          )}
        </div>

        <PeriodChips
          label="Período del gráfico"
          value={activePeriod}
          onChange={setPeriod}
          className="mt-1 justify-around"
          options={[
            { key: "24h", label: "24H", disabled: historical },
            { key: "7d", label: "7D" },
            { key: "30d", label: "30D" },
          ]}
        />
      </div>

      {historical && (
        <button
          type="button"
          onClick={market.clearHistoricalView}
          className="mb-1 mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-ctl border border-brand/30 bg-brand/10 text-[13px] font-semibold text-brand-light outline-none transition hover:bg-brand/15 focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <History className="h-4 w-4" aria-hidden />
          Volver a tiempo real
        </button>
      )}
    </section>
  )
}
