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
              className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold tabular-nums transition duration-200 group-focus-visible:ring-2 group-focus-visible:ring-gold/40 group-active:scale-[0.97] ${
                active
                  ? "border-hairbright bg-surface-soft text-ink"
                  : option.disabled
                    ? "border-transparent text-ink-faint/50"
                    : "border-transparent text-ink-faint group-hover:text-ink-muted"
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
