import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"
import { tint } from "../ui/tone"

/**
 * Piezas de las pantallas de ajustes (Más, Alertas de precio): una
 * sección con título en versalitas, filas con icono y un interruptor.
 * Todas las filas tocables miden al menos 44px de alto.
 */

export function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mt-6">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          {title}
        </h2>
        {action}
      </div>
      <div className="overflow-hidden rounded-card border border-hair bg-surface">
        {children}
      </div>
    </section>
  )
}

export function Row({
  icon: Icon,
  media,
  title,
  description,
  accent = "rgb(var(--c-text-soft))",
  right,
  onClick,
}: {
  icon?: LucideIcon
  /** Icono propio (VcIcon); se pinta dentro del mismo círculo con `accent`. */
  media?: ReactNode
  title: string
  description?: string
  accent?: string
  right?: ReactNode
  onClick?: () => void
}) {
  const body = (
    <>
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: tint(accent), color: accent }}
      >
        {media ?? (Icon && <Icon className="h-[17px] w-[17px]" strokeWidth={2.1} />)}
      </span>

      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[14px] font-semibold text-ink">
          {title}
        </span>
        {description && (
          <span className="mt-0.5 block text-[12px] leading-snug text-ink-muted">
            {description}
          </span>
        )}
      </span>

      {right}

      {onClick && (
        <ChevronRight
          className="h-4 w-4 shrink-0 text-ink-faint"
          strokeWidth={2.2}
          aria-hidden
        />
      )}
    </>
  )

  const shell =
    "flex min-h-11 w-full items-center gap-3 border-b border-hair px-4 py-3.5 last:border-b-0"

  if (!onClick) {
    return <div className={shell}>{body}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${shell} text-left outline-none transition duration-200 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.99]`}
    >
      {body}
    </button>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  busy,
}: {
  checked: boolean
  onChange: () => void
  label: string
  busy?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={busy}
      onClick={onChange}
      // El área tocable es de 44px aunque el interruptor se vea más chico.
      className="relative -m-2 flex h-11 w-16 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50"
    >
      <span
        className={`relative h-7 w-12 rounded-full border transition-colors duration-200 ${
          checked ? "border-brand bg-brand" : "border-hairbright bg-surface-soft"
        }`}
      >
        {/* Se desplaza con transform (no con left): sin recalcular layout. */}
        <span
          className={`absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  )
}
