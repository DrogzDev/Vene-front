import { useRef } from "react"

import type { PriceChartPoint, PriceChartRange, PriceChartSummary, PriceSource } from "../../types/prices"
import { useRevealOnce } from "../../motion/useRevealOnce"
import { formatBs } from "../../utils/format"
import { Disclosure } from "../ui/primitives"
import { TONE_HEX, TONE_TEXT, formatSignedPercent } from "../ui/tone"
import { VcIcon } from "../ui/VcIcon"

const FIELD: Record<PriceSource, keyof PriceChartPoint> = {
  average: "average_price",
  bcv: "bcv",
  usdt: "binance_best_price",
  eur: "eur_bcv",
}

const timeFormatter = new Intl.DateTimeFormat("es-VE", {
  timeZone: "America/Caracas",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

const dayFormatter = new Intl.DateTimeFormat("es-VE", {
  timeZone: "America/Caracas",
  day: "numeric",
  month: "short",
})

function when(iso: string | null, range: PriceChartRange) {
  if (!iso) return "—"

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"

  return (range === "24h" ? timeFormatter : dayFormatter).format(date).replace(".", "")
}

type Move = { at: string; percent: number; from: number; to: number }

/** Mayor cambio entre dos muestras reales consecutivas del período. */
function largestMove(points: PriceChartPoint[], source: PriceSource): Move | null {
  const field = FIELD[source]
  let previous: { value: number } | null = null
  let best: Move | null = null

  for (const point of points) {
    const value = point[field]

    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue

    if (previous) {
      const percent = ((value - previous.value) / previous.value) * 100

      if (!best || Math.abs(percent) > Math.abs(best.percent)) {
        best = { at: point.at, percent, from: previous.value, to: value }
      }
    }

    previous = { value }
  }

  return best
}

type TimelineEvent = {
  key: string
  /** Momento real del evento; ordena la línea de tiempo. */
  at: string | null
  color: string
  title: string
  detail?: string
  value: string
  valueClassName: string
}

/**
 * Eventos del período en forma de línea de tiempo, solo FACTUALES:
 * máximo, mínimo y el mayor movimiento entre muestras consecutivas.
 * No se atribuyen causas (demanda, intervención, noticias): el backend
 * no las conoce y no se inventan.
 *
 * Los eventos aparecen en cascada la primera vez que entran en pantalla.
 */
export default function PeriodEvents({
  summary,
  points,
  source,
  range,
}: {
  summary: PriceChartSummary
  points: PriceChartPoint[]
  source: PriceSource
  range: PriceChartRange
}) {
  const listRef = useRef<HTMLOListElement | null>(null)

  useRevealOnce(listRef, "[data-event]")

  if (summary.samples < 3) return null

  const move = largestMove(points, source)

  const events: TimelineEvent[] = []

  if (summary.high != null) {
    events.push({
      key: "high",
      at: summary.high_at,
      color: TONE_HEX.up,
      title: "Máximo del período",
      value: `Bs ${formatBs(summary.high)}`,
      valueClassName: TONE_TEXT.up,
    })
  }

  if (summary.low != null) {
    events.push({
      key: "low",
      at: summary.low_at,
      color: TONE_HEX.down,
      title: "Mínimo del período",
      value: `Bs ${formatBs(summary.low)}`,
      valueClassName: TONE_TEXT.down,
    })
  }

  if (move && move.percent !== 0) {
    events.push({
      key: "move",
      at: move.at,
      color: "#C9A86A",
      title: range === "24h" ? "Mayor salto entre capturas" : "Mayor salto entre cierres",
      detail: `${formatBs(move.from)} → ${formatBs(move.to)}`,
      value: formatSignedPercent(move.percent),
      valueClassName: move.percent > 0 ? TONE_TEXT.up : TONE_TEXT.down,
    })
  }

  // Lo más reciente arriba, como una línea de tiempo.
  events.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""))

  return (
    <Disclosure
      title="Eventos del período"
      subtitle={`${events.length} evento${events.length === 1 ? "" : "s"}`}
      icon={<VcIcon name="period-events" className="h-[18px] w-[18px] shrink-0 text-ink-muted" />}
    >
      <ol ref={listRef} className="relative rounded-card border border-hair bg-surface px-3.5 py-1">
        {/* Raíl vertical que une los puntos. */}
        <span aria-hidden className="absolute bottom-5 left-[21px] top-5 w-px bg-hairbright" />

        {events.map((event) => (
          <li key={event.key} data-event className="relative flex items-start gap-3 py-2.5">
            <span
              aria-hidden
              className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-surface"
              style={{ backgroundColor: event.color }}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold tabular-nums text-ink-faint">{when(event.at, range)}</span>
              <span className="block truncate text-[13px] font-semibold text-ink">{event.title}</span>
              {event.detail && <span className="block truncate text-[12px] text-ink-muted">{event.detail}</span>}
            </span>
            <span className={`mt-3.5 shrink-0 text-[14px] font-bold tabular-nums ${event.valueClassName}`}>
              {event.value}
            </span>
          </li>
        ))}
      </ol>
    </Disclosure>
  )
}
