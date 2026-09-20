import type { PriceChartRange, PriceChartSummary } from "../../types/prices"
import { formatBs, formatBsChange, formatRelativeFromNow } from "../../utils/format"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "./icons"
import { getRangeOption, getSourceOption } from "./theme"
import type { SourceOption } from "./theme"

type Props = {
  summary: PriceChartSummary
  source: SourceOption
  range: PriceChartRange
}

type StatProps = {
  label: string
  value: number | null
  tone?: "neutral" | "up" | "down"
}

function Stat({ label, value, tone = "neutral" }: StatProps) {
  const toneClass =
    tone === "up" ? "text-[#34d399]" : tone === "down" ? "text-[#f87171]" : "text-[#d7dbe3]"

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#646d7d]">
        {label}
      </p>
      <p className={`mt-0.5 truncate text-sm font-semibold tabular-nums ${toneClass}`}>
        {value === null ? "—" : `Bs ${formatBs(value)}`}
      </p>
    </div>
  )
}

/**
 * Cabecera financiera: precio de cierre, variación del período y la
 * rejilla apertura/máximo/mínimo/cierre.
 *
 * Todas las cifras llegan calculadas por Django sobre la serie que el
 * usuario tiene seleccionada; aquí no se hace aritmética financiera
 * salvo la comparación contextual con la apertura, que es una resta
 * directa sobre esos mismos valores.
 */
export default function PriceHero({ summary, source, range }: Props) {
  const changePercent = summary.change_percent
  const change = summary.change

  const isUp = (changePercent ?? 0) > 0
  const isDown = (changePercent ?? 0) < 0

  const changeColor = isUp ? "#34d399" : isDown ? "#f87171" : "#8b93a3"

  const ChangeIcon = isUp ? ArrowUpIcon : isDown ? ArrowDownIcon : MinusIcon

  const updated = formatRelativeFromNow(summary.last_at)
  const rangeLabel = getRangeOption(range).long
  const pair = getSourceOption(summary.series ?? source.key).pair

  return (
    <section
      // La animación de entrada se relanza al cambiar de serie o rango.
      key={`${summary.series}-${range}`}
      className="motion-safe:animate-hero-in"
      aria-label="Resumen del precio"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <p className="text-[2.125rem] font-bold leading-none tracking-tight tabular-nums text-[#e9ebf0] sm:text-[2.75rem]">
          <span className="mr-1.5 text-[0.55em] font-semibold text-[#8b93a3]">Bs</span>
          {summary.close === null ? "—" : formatBs(summary.close)}
        </p>

        {changePercent !== null && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums"
            style={{
              color: changeColor,
              backgroundColor: `${changeColor}1a`,
            }}
          >
            <ChangeIcon />
            {Math.abs(changePercent).toFixed(2)}%
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8b93a3]">
        <span className="font-medium text-[#a8b0be]">{pair}</span>
        <span aria-hidden className="text-[#3a4150]">
          ·
        </span>
        <span>Actualizado {updated}</span>
      </div>

      {change !== null && summary.open !== null && (
        <p className="mt-3 inline-flex items-center rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-xs text-[#8b93a3]">
          <span className="font-semibold tabular-nums" style={{ color: changeColor }}>
            {formatBsChange(change)}
          </span>
          <span className="ml-1.5">desde la apertura de {rangeLabel}</span>
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-white/[0.05] pt-4 sm:grid-cols-4">
        <Stat label="Apertura" value={summary.open} />
        <Stat label="Máximo" value={summary.high} tone="up" />
        <Stat label="Mínimo" value={summary.low} tone="down" />
        <Stat label="Cierre" value={summary.close} />
      </div>

      <p className="mt-3 text-[11px] text-[#646d7d]">
        {summary.samples} {summary.samples === 1 ? "muestra" : "muestras"} en {rangeLabel}
      </p>
    </section>
  )
}
