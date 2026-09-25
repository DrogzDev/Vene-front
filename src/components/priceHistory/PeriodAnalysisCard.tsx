import { ChevronRight } from "lucide-react"

import type { MarketAnalysis } from "../../types/prices"
import { VcIcon } from "../ui/VcIcon"

/**
 * Acceso compacto al análisis del período.
 *
 * Visualmente es la fila gemela del acordeón "Eventos del período" (mismo
 * icono, título y subtítulo que un Disclosure), pero no es un Disclosure
 * real: ya muestra su resumen de dos líneas siempre visible, así que no
 * hay contenido extra que "expandir" solo para pedir otro toque. El
 * ChevronRight (en vez de un ChevronDown que gira) señala que este toque
 * abre una vista nueva, no que despliega algo en el sitio.
 *
 * Si ya hay un análisis generado para este rango y fuente, muestra su
 * titular y resumen recortados a dos líneas: texto real del backend. Si
 * no lo hay, describe qué se analizaría, sin adelantar conclusiones.
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
      className="flex min-h-14 w-full items-center gap-3 rounded-card border border-hair bg-surface px-4 py-3 text-left outline-none transition duration-150 hover:border-hairbright hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.99]"
    >
      <VcIcon name="trend-analysis" className="h-[18px] w-[18px] shrink-0 text-ink-muted" />

      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-ink">Análisis del período</span>
        <span className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink-muted">
          {analysis ? `${analysis.headline.replace(/[.!?…:]+$/, "")}. ${analysis.summary}` : fallback}
        </span>
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
    </button>
  )
}
