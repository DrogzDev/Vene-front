import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"

/**
 * Una card con filas separadas por líneas finas: "Tasas del mercado",
 * eventos, ajustes. Evita la card-dentro-de-card.
 */
export function ListCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`divide-y divide-hair overflow-hidden rounded-card border border-hair bg-surface ${className}`}>
      {children}
    </div>
  )
}

export function ListRow({
  icon: Icon,
  media,
  accent = "#9D72FF",
  title,
  subtitle,
  right,
  onClick,
  selected = false,
}: {
  icon?: LucideIcon
  /** Icono ya construido (p. ej. un CurrencyIcon); sustituye a `icon`. */
  media?: ReactNode
  accent?: string
  title: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  onClick?: () => void
  /** Marca la fila activa (p. ej. la tasa elegida en Convertir). */
  selected?: boolean
}) {
  const body = (
    <>
      {media ?? (Icon && (
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
        </span>
      ))}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-ink">{title}</span>
        {subtitle && <span className="block truncate text-[12px] text-ink-muted">{subtitle}</span>}
      </span>

      {right}
    </>
  )

  const shell = `flex min-h-14 w-full items-center gap-3 px-3.5 py-2.5 ${selected ? "bg-brand/[0.08]" : ""}`

  if (!onClick) return <div className={shell}>{body}</div>

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`${shell} text-left outline-none transition-colors duration-150 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50`}
    >
      {body}
      <ChevronRight className="-ml-1 h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
    </button>
  )
}
