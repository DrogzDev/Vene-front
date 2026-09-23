import { useRef } from "react"

export type SegmentOption<T extends string> = {
  key: T
  label: string
}

type Props<T extends string> = {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Etiqueta accesible del grupo. */
  label: string
  /** Variantes compactas: "sm" (40px) para controles, "xs" (36px) para barras densas. */
  size?: "md" | "sm" | "xs"
}

/**
 * Selector tipo aplicación móvil: el indicador activo es un único
 * bloque que se desplaza con transform, así la transición es suave y
 * no provoca reflow.
 *
 * Teclado: flechas para moverse entre opciones, como pide el patrón
 * de tablist de WAI-ARIA.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
}: Props<T>) {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([])

  const activeIndex = Math.max(
    options.findIndex((option) => option.key === value),
    0,
  )

  function focusOption(index: number) {
    const next = (index + options.length) % options.length

    onChange(options[next].key)
    buttonsRef.current[next]?.focus()
  }

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault()
      focusOption(index + 1)
      return
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault()
      focusOption(index - 1)
      return
    }

    if (event.key === "Home") {
      event.preventDefault()
      focusOption(0)
      return
    }

    if (event.key === "End") {
      event.preventDefault()
      focusOption(options.length - 1)
    }
  }

  const heightClass = size === "xs" ? "h-9" : size === "sm" ? "h-10" : "h-11"
  const textClass = size === "md" ? "text-sm" : "text-[13px]"

  return (
    <div
      role="tablist"
      aria-label={label}
      // El cálculo del indicador asume segmentos de igual ancho y un
      // padding de 1 (0.5rem en total). Cambiar cualquiera de las dos
      // cosas lo desalinea.
      className={`relative flex ${heightClass} w-full items-stretch rounded-ctl border border-hair bg-surface p-1`}
    >
      {/* Indicador deslizante. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-1 rounded-[10px] bg-brand shadow-brand motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {options.map((option, index) => {
        const isActive = option.key === value

        return (
          <button
            key={option.key}
            ref={(element) => {
              buttonsRef.current[index] = element
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.key)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`relative z-10 flex-1 rounded-[10px] ${textClass} font-semibold tracking-tight outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand/50 ${
              isActive ? "text-white" : "text-ink-muted hover:text-ink-soft"
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
