import type { ReactNode } from "react"
import { ChevronRight, Maximize2, RotateCcw } from "lucide-react"

import { IconButton } from "./primitives"
import { VcIcon } from "./VcIcon"

/**
 * Contenedor de gráfico: card con poco padding para que el canvas
 * aproveche el ancho. Un solo wrapper estable: cambiar su estilo no
 * desmonta el gráfico de dentro.
 */
export function ChartCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-card border border-hair bg-surface p-2.5 sm:p-4 ${className}`}>
      {children}
    </section>
  )
}

/**
 * Barra de herramientas del gráfico: el control principal a la izquierda
 * (modo Línea/Velas) y los botones de zoom/pantalla completa a la derecha.
 */
export function ChartToolbar({
  children,
  onReset,
  onExpand,
  className = "",
}: {
  children?: ReactNode
  onReset?: () => void
  onExpand?: () => void
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      {onReset && (
        <IconButton label="Restablecer zoom" onClick={onReset}>
          <RotateCcw className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </IconButton>
      )}
      {onExpand && (
        <IconButton label="Pantalla completa" onClick={onExpand}>
          <Maximize2 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </IconButton>
      )}
    </div>
  )
}

/**
 * Botón "Analizar con IA" (Mercado Simple y Pro): bloque violeta con el
 * texto centrado, la acción principal debajo de los controles del gráfico.
 */
export function AnalyzeCta({
  subtitle,
  onClick,
}: {
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-h-[58px] w-full items-center justify-center rounded-card border border-brand-light/30 bg-gradient-to-b from-brand-bright to-brand px-12 py-2.5 text-white outline-none transition duration-150 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand/60 active:scale-[0.99]"
    >
      <span className="min-w-0 text-center">
        <span className="flex items-center justify-center gap-1.5 text-[15px] font-bold">
          <VcIcon name="ai" className="h-4 w-4" />
          Analizar con IA
        </span>
        <span className="block truncate text-[12px] text-white/75">{subtitle}</span>
      </span>
      <ChevronRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/80" aria-hidden />
    </button>
  )
}
