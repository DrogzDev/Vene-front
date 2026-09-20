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
  /** Variante compacta para los controles del gráfico. */
  size?: "md" | "sm"
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

  const heightClass = size === "sm" ? "h-9" : "h-11"
  const textClass = size === "sm" ? "text-xs" : "text-sm"

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`relative flex ${heightClass} w-full items-stretch rounded-2xl border border-white/[0.06] bg-white/[0.03] p-1`}
    >
      {/* Indicador deslizante. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-1 rounded-xl bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]"
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
            className={`relative z-10 flex-1 rounded-xl ${textClass} font-semibold tracking-tight outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/30 ${
              isActive ? "text-white" : "text-[#8b93a3] hover:text-[#c9cfda]"
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
