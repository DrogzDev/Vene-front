import type { PriceSource } from "../../types/prices"
import { CurrencyIcon } from "../ui/VcIcon"
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
      className="no-scrollbar -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-0.5 [justify-content:safe_center]"
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
            className={`inline-flex h-10 shrink-0 snap-start items-center gap-2 rounded-full border px-3 text-[13px] font-semibold tracking-tight outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.97] ${
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
            <CurrencyIcon
              name={option.key}
              className={`h-5 w-5 shrink-0 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-60"}`}
            />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
