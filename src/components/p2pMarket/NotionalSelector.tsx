type Props = {
  value: number
  onChange: (value: number) => void
  levels: number[]
}

/**
 * Tamaño de operación. Al cambiarlo, el chart pasa a mostrar el precio
 * realmente ejecutable estimado para ese monto (precio ponderado,
 * calculado en el backend a partir del order book real) en vez de
 * solo el mejor anuncio.
 */
export default function NotionalSelector({ value, onChange, levels }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Tamaño de operación"
      className="flex items-center gap-1.5"
    >
      {levels.map((level) => {
        const isActive = level === value

        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(level)}
            className={`h-8 shrink-0 rounded-lg px-2.5 text-xs font-semibold tabular-nums outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-white/30 ${
              isActive
                ? "bg-white/[0.1] text-white"
                : "text-[#8b93a3] hover:bg-white/[0.05] hover:text-[#c9cfda]"
            }`}
          >
            {level}
          </button>
        )
      })}
    </div>
  )
}
