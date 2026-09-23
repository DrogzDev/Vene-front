import type { PriceSource } from "../../types/prices"
import { SOURCE_OPTIONS } from "./theme"

type Props = {
  value: PriceSource
  onChange: (value: PriceSource) => void
}

/**
 * Chips de fuente.
 *
 * La lista sale de SOURCE_OPTIONS, así que añadir una cuarta fuente no
 * obliga a tocar este componente. El contenedor solo se convierte en
 * carrusel cuando el contenido realmente no cabe.
 */
export default function SourceChips({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Fuente del precio"
      className="no-scrollbar -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-0.5"
    >
      {SOURCE_OPTIONS.map((option) => {
        const isActive = option.key === value

        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.key)}
            className={`inline-flex h-10 shrink-0 snap-start items-center gap-2 rounded-full border px-4 text-[13px] font-semibold tracking-tight outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.97] ${
              isActive
                ? "border-transparent text-white"
                : "border-hair bg-surface text-ink-muted hover:bg-surface-raised hover:text-ink-soft"
            }`}
            style={
              isActive
                ? {
                    backgroundColor: `${option.color}1f`,
                    boxShadow: `inset 0 0 0 1px ${option.color}59`,
                    color: option.color,
                  }
                : undefined
            }
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full transition-opacity duration-200"
              style={{
                backgroundColor: option.color,
                opacity: isActive ? 1 : 0.45,
              }}
            />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
