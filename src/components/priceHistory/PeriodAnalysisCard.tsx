import { ChevronRight } from "lucide-react"

import type { MarketAnalysis } from "../../types/prices"
import { VcIcon } from "../ui/VcIcon"

/**
 * Acceso compacto al análisis del período.
 *
 * Si ya hay un análisis generado para este rango y fuente, muestra su
 * titular y resumen recortados a dos líneas: texto real del backend. Si
 * no lo hay, describe qué se analizaría, sin adelantar conclusiones.
 * El análisis completo se abre en el panel existente.
 */
export default function PeriodAnalysisCard({
  analysis,
  fallback,
  onOpen,
}: {
  analysis: MarketAnalysis | null
  /** Descripción cuando todavía no se generó ningún análisis. */
  fallback: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 rounded-card border border-hair bg-surface px-4 py-3.5 text-left outline-none transition duration-150 hover:border-hairbright hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.99]"
    >
      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-brand/15 text-brand-light">
        <VcIcon name="trend-analysis" className="h-[18px] w-[18px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-ink">Análisis del período</span>
        <span className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink-muted">
          {analysis ? `${analysis.headline.replace(/[.!?…:]+$/, "")}. ${analysis.summary}` : fallback}
        </span>
        <span className="mt-1.5 inline-flex items-center gap-0.5 text-[12px] font-semibold text-brand-light">
          Ver análisis
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </span>
    </button>
  )
}
