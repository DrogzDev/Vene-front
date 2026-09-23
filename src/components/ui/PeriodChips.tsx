type Option<T extends string> = { key: T; label: string; disabled?: boolean }

/**
 * Chips de período dentro de una card ("24H 7D 30D"). Visualmente
 * pequeños (28 px) pero con 44 px de zona tocable gracias al padding
 * vertical negativo del contenedor.
 */
export default function PeriodChips<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
}: {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={`-my-2 flex items-center gap-1 ${className}`}>
      {options.map((option) => {
        const active = option.key === value

        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={option.disabled}
            onClick={() => onChange(option.key)}
            className="group flex h-11 items-center outline-none disabled:cursor-not-allowed"
          >
            <span
              className={`rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums transition-colors duration-150 group-focus-visible:ring-2 group-focus-visible:ring-brand/50 ${
                active
                  ? "bg-brand/20 text-brand-light"
                  : option.disabled
                    ? "text-ink-faint/50"
                    : "text-ink-muted group-hover:text-ink-soft"
              }`}
            >
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
