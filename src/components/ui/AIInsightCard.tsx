import { ChevronRight } from "lucide-react"

import type { AiAnalysisListItem } from "../../types/prices"
import { formatRelativeFromNow } from "../../utils/format"
import { RISK_LABELS, TREND_LABELS, riskColor, trendColor } from "../p2pMarket/theme"
import { StatChip } from "./primitives"
import { VcIcon } from "./VcIcon"

type Props = {
  /** undefined = cargando; null = no hay ningún análisis guardado. */
  analysis: AiAnalysisListItem | null | undefined
  /** Más de 24 h: se avisa en vez de presentarlo como actual. */
  stale?: boolean
  onOpen: () => void
}

/**
 * Acceso compacto al análisis IA (≤ 88 px).
 *
 * Solo muestra lo que el último análisis GUARDADO dice, con su
 * antigüedad a la vista. Nunca ejecuta el modelo por su cuenta y, si no
 * hay análisis, invita a pedir uno en vez de inventar una conclusión.
 */
export default function AIInsightCard({ analysis, stale: isStale = false, onOpen }: Props) {
  const loading = analysis === undefined

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={loading}
      className="flex min-h-[72px] w-full items-center gap-3 rounded-card border border-brand/20 bg-gradient-to-br from-brand/[0.10] to-transparent px-4 py-3 text-left outline-none transition duration-150 hover:border-brand/35 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.99] disabled:opacity-70"
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-light"
      >
        <VcIcon name="ai" className="h-[18px] w-[18px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-brand-light">Análisis IA</span>
          {analysis && (
            <span className={`truncate text-[11px] ${isStale ? "text-warn" : "text-ink-faint"}`}>
              {isStale ? "Análisis de " : ""}
              {formatRelativeFromNow(analysis.generated_at)}
            </span>
          )}
        </span>

        {loading ? (
          <span className="mt-1 block h-4 w-3/4 rounded bg-surface-raised motion-safe:animate-pulse-soft" />
        ) : analysis ? (
          <>
            <span className="mt-0.5 block truncate text-[14px] font-semibold text-ink">{analysis.headline}</span>
            <span className="mt-1 flex gap-1.5 overflow-hidden">
              <StatChip color={trendColor(analysis.market_state)}>
                Tendencia {TREND_LABELS[analysis.market_state]?.toLowerCase()}
              </StatChip>
              <StatChip color={riskColor(analysis.risk_level)}>
                Riesgo {RISK_LABELS[analysis.risk_level]?.toLowerCase()}
              </StatChip>
            </span>
          </>
        ) : (
          <>
            <span className="mt-0.5 block text-[14px] font-semibold text-ink">Analizar el mercado con IA</span>
            <span className="block truncate text-[12px] text-ink-muted">
              Aún no hay un análisis guardado del USDT.
            </span>
          </>
        )}
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
    </button>
  )
}
