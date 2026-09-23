import { useEffect, useId, useRef, useState } from "react"
import type { ElementType, ReactNode } from "react"
import { ChevronDown, ChevronRight, Info, Minus, TrendingDown, TrendingUp } from "lucide-react"

import { formatBs } from "../../utils/format"
import { TONE_HEX, TONE_TEXT, formatSignedPercent, toneOf } from "./tone"
import type { Tone } from "./tone"

/*
 * Piezas base del design system de VeneCambio. Son pequeñas a propósito:
 * cada pantalla las compone, ninguna trae datos propios ni hace fetch.
 */

// ---------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------

type CardProps = {
  children: ReactNode
  className?: string
  /** "md" = 16px, "sm" = 12px, "none" = sin padding (listas con filas). */
  padding?: "none" | "sm" | "md"
  as?: ElementType
}

const CARD_PADDING = { none: "", sm: "p-3", md: "p-4" } as const

export function Card({ children, className = "", padding = "md", as: Tag = "div" }: CardProps) {
  return (
    <Tag className={`rounded-card border border-hair bg-surface ${CARD_PADDING[padding]} ${className}`}>
      {children}
    </Tag>
  )
}

// ---------------------------------------------------------------------
// SectionHeader
// ---------------------------------------------------------------------

export function SectionHeader({
  title,
  action,
  className = "",
}: {
  title: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex min-h-9 items-center justify-between gap-3 ${className}`}>
      <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
      {action && <div className="flex shrink-0 items-center gap-1">{action}</div>}
    </div>
  )
}

/** Etiqueta en versalitas para grupos dentro de una card o de Más. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint ${className}`}>
      {children}
    </p>
  )
}

/** "Ver todo ›" para la cabecera de una sección. */
export function SeeAllButton({ onClick, label = "Ver todo" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mr-2 flex min-h-11 items-center gap-0.5 rounded-lg px-2 text-[13px] font-semibold text-brand-light outline-none transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/50"
    >
      {label}
      <ChevronRight className="h-4 w-4" aria-hidden />
    </button>
  )
}

// ---------------------------------------------------------------------
// Precio y variación
// ---------------------------------------------------------------------

export function PriceDisplay({
  value,
  size = "lg",
  className = "",
}: {
  value: number | null | undefined
  size?: "xl" | "lg" | "md"
  className?: string
}) {
  const sizeClass =
    size === "xl"
      ? "text-[clamp(30px,9.5vw,38px)]"
      : size === "lg"
        ? "text-[clamp(28px,8.5vw,34px)]"
        : "text-[22px]"

  return (
    <p className={`font-extrabold leading-none tracking-tight tabular-nums text-ink ${sizeClass} ${className}`}>
      <span className="mr-1 text-[0.5em] font-bold text-ink-muted">Bs</span>
      {value == null || !Number.isFinite(value) ? "—" : formatBs(value)}
    </p>
  )
}

export function TrendBadge({
  value,
  suffix,
  size = "md",
}: {
  value: number | null | undefined
  /** Texto tenue tras el porcentaje, p. ej. "24h". */
  suffix?: string
  size?: "sm" | "md"
}) {
  if (value == null) return null

  const tone = toneOf(value)
  const Icon = tone === "up" ? TrendingUp : tone === "down" ? TrendingDown : Minus
  const color = TONE_HEX[tone]

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-bold tabular-nums ${
        size === "sm" ? "px-2 py-0.5 text-[12px]" : "px-2.5 py-1 text-[13px]"
      }`}
      style={{ color, backgroundColor: `${color}1a` }}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.4} aria-hidden />
      {formatSignedPercent(value)}
      {suffix && <span className="font-semibold opacity-70">{suffix}</span>}
    </span>
  )
}

// ---------------------------------------------------------------------
// Métricas
// ---------------------------------------------------------------------

export function MetricCell({
  label,
  value,
  tone = "neutral",
  compact = false,
  className = "",
}: {
  label: string
  value: ReactNode
  tone?: Tone
  /** Etiqueta sin versalitas, para rejillas de 4 columnas en 360 px. */
  compact?: boolean
  className?: string
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p
        className={`truncate text-[11px] font-semibold text-ink-faint ${
          compact ? "" : "uppercase tracking-[0.08em]"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-0.5 truncate text-[14px] font-bold tabular-nums ${
          tone === "neutral" ? "text-ink" : TONE_TEXT[tone]
        }`}
      >
        {value}
      </p>
    </div>
  )
}

/**
 * Rejilla de métricas en UNA card: celdas separadas por líneas finas,
 * no una card por dato.
 */
export function MetricGrid({
  children,
  columns = 3,
  className = "",
}: {
  children: ReactNode
  columns?: 2 | 3 | 4
  className?: string
}) {
  const cols = columns === 4 ? "grid-cols-4" : columns === 2 ? "grid-cols-2" : "grid-cols-3"

  return (
    <div
      className={`grid ${cols} gap-px overflow-hidden rounded-tile border border-hair bg-hair [&>*]:bg-surface [&>*]:px-3 [&>*]:py-2.5 ${className}`}
    >
      {children}
    </div>
  )
}

export function StatChip({
  children,
  color,
  icon,
}: {
  children: ReactNode
  /** Hex del tono; por defecto gris azulado. */
  color?: string
  icon?: ReactNode
}) {
  const hex = color ?? "#8B98A8"

  return (
    <span
      className="inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[12px] font-semibold"
      style={{ color: hex, backgroundColor: `${hex}1a` }}
    >
      {icon}
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------
// Controles
// ---------------------------------------------------------------------

export function IconButton({
  label,
  onClick,
  children,
  active = false,
  disabled = false,
  className = "",
}: {
  label: string
  onClick: () => void
  children: ReactNode
  active?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl border outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-95 disabled:opacity-50 ${
        active
          ? "border-brand/40 bg-brand/15 text-brand-light"
          : "border-hair bg-surface-raised text-ink-soft hover:text-ink"
      } ${className}`}
    >
      {children}
    </button>
  )
}

type ChipOption<T extends string> = { key: T; label: string }

/**
 * Fila de chips con scroll horizontal (timeframes, rangos, notional).
 * Nunca se parte en varias líneas: en 360 px se desplaza.
 */
export function ChipScroller<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
  size = "md",
}: {
  options: ChipOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
  /** "sm": chips compactos (32 px, 12 px) para filas secundarias. */
  size?: "md" | "sm"
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // La opción activa nunca queda escondida fuera de la fila.
  useEffect(() => {
    const active = containerRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')
    const container = containerRef.current

    // Solo se desplaza la fila, nunca la página.
    if (active && container) {
      container.scrollLeft = active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2
    }
  }, [value])

  return (
    <div ref={containerRef} role="radiogroup" aria-label={label} className={`scroll-x relative gap-1.5 ${className}`}>
      {options.map((option) => {
        const active = option.key === value

        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.key)}
            className={`${size === "sm" ? "h-8 min-w-10 rounded-full px-3 text-[12px]" : "h-9 min-w-11 rounded-ctl px-3 text-[13px]"} font-semibold tabular-nums outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-95 ${
              active
                ? "bg-brand/15 text-brand-light ring-1 ring-inset ring-brand/40"
                : "text-ink-muted hover:bg-surface-raised hover:text-ink-soft"
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------
// Avisos y bloques plegables
// ---------------------------------------------------------------------

export function Notice({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode
  tone?: "neutral" | "warn" | "down"
  className?: string
}) {
  const toneClass =
    tone === "warn" ? "text-warn" : tone === "down" ? "text-down" : "text-ink-muted"

  return (
    <div
      className={`flex items-start gap-2.5 rounded-tile border border-hair bg-surface px-3 py-2.5 text-[12px] leading-relaxed ${toneClass} ${className}`}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/**
 * Información secundaria bajo demanda. El contenido no se monta hasta
 * abrirse, así que no hace trabajo que nadie mira.
 */
export function Disclosure({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <Card padding="none">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-ink">{title}</span>
          {subtitle && <span className="mt-0.5 block truncate text-[12px] text-ink-muted">{subtitle}</span>}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div id={panelId} className="border-t border-hair px-4 pb-4 pt-3 motion-safe:animate-fade-in-fast">
          {children}
        </div>
      )}
    </Card>
  )
}
