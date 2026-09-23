import type { PriceChartRange, PriceChartSummary } from "../../types/prices"
import { formatRelativeFromNow } from "../../utils/format"
import { PriceDisplay, TrendBadge } from "../ui/primitives"
import { getRangeOption, getSourceOption } from "./theme"
import type { SourceOption } from "./theme"

type Props = {
  summary: PriceChartSummary
  source: SourceOption
  range: PriceChartRange
}

/**
 * Cabecera de la card principal de Historial: cierre, variación del
 * período y contexto (serie, período real, muestras, antigüedad). Va
 * dentro de la misma card que el gráfico. Al cambiar de serie o de
 * rango, la página hace la transición (useCrossfade).
 */
export default function PriceHero({ summary, source, range }: Props) {
  const pair = getSourceOption(summary.series ?? source.key).pair
  const unit = range === "24h" ? (summary.samples === 1 ? "muestra" : "muestras") : summary.samples === 1 ? "cierre" : "cierres"

  return (
    <section aria-label="Resumen del precio">
      <div className="flex items-end justify-between gap-3">
        <PriceDisplay value={summary.close} size="lg" />
        <div className="pb-0.5">
          <TrendBadge value={summary.change_percent} />
        </div>
      </div>

      <p className="mt-1 truncate text-[12px] text-ink-muted">
        <span className="font-semibold text-ink-soft">{pair}</span>
        <span className="text-ink-faint"> · </span>
        Variación en {getRangeOption(range).long}
      </p>
      <p className="truncate text-[11px] text-ink-faint">
        {summary.samples} {unit} · Actualizado {formatRelativeFromNow(summary.last_at)}
      </p>
    </section>
  )
}
