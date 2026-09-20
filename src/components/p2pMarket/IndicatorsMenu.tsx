export type IndicatorKey = "ma7" | "ma25" | "ma99"

const INDICATOR_OPTIONS: { key: IndicatorKey; label: string; color: string }[] = [
  { key: "ma7", label: "MA 7", color: "#38bdf8" },
  { key: "ma25", label: "MA 25", color: "#facc15" },
  { key: "ma99", label: "MA 99", color: "#a78bfa" },
]

type Props = {
  active: Set<IndicatorKey>
  onToggle: (key: IndicatorKey) => void
}

export { INDICATOR_OPTIONS }

/**
 * Chips para activar/desactivar medias móviles sobre el candlestick.
 *
 * Deliberadamente solo tres: el pedido es "no llenar el dashboard con
 * veinte indicadores todavía". Los cálculos viven en el backend
 * (api/services/market_indicators.py); esto solo pide o no cada serie.
 */
export default function IndicatorsMenu({ active, onToggle }: Props) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Indicadores">
      {INDICATOR_OPTIONS.map((option) => {
        const isActive = active.has(option.key)

        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(option.key)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-white/30 ${
              isActive
                ? "border-transparent bg-white/[0.08] text-white"
                : "border-white/[0.06] text-[#646d7d] hover:text-[#c9cfda]"
            }`}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full transition-opacity"
              style={{ backgroundColor: option.color, opacity: isActive ? 1 : 0.4 }}
            />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
