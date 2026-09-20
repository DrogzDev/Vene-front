import type { P2PSupportedTimeframe, P2PTimeframeKey } from "../../types/prices"

type Props = {
  timeframes: P2PSupportedTimeframe[]
  value: P2PTimeframeKey
  onChange: (value: P2PTimeframeKey) => void
}

/**
 * Toolbar de timeframes tipo exchange.
 *
 * Solo se listan los timeframes que el backend marcó disponibles con
 * los datos reales que existen ahora mismo (ver
 * api/services/p2p_history.py::get_supported_timeframes). Uno no
 * disponible se muestra atenuado con su motivo en el título, en vez
 * de ocultarse sin explicación.
 */
export default function TimeframeToolbar({ timeframes, value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Timeframe"
      className="-mx-1 flex snap-x gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {timeframes.map((timeframe) => {
        const isActive = timeframe.key === value

        return (
          <button
            key={timeframe.key}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={!timeframe.available}
            title={timeframe.available ? undefined : (timeframe.reason ?? undefined)}
            onClick={() => timeframe.available && onChange(timeframe.key)}
            className={`h-8 shrink-0 snap-start rounded-lg px-2.5 text-xs font-semibold tabular-nums outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-white/30 ${
              isActive
                ? "bg-white/[0.1] text-white"
                : timeframe.available
                  ? "text-[#8b93a3] hover:bg-white/[0.05] hover:text-[#c9cfda]"
                  : "cursor-not-allowed text-[#3f4757]"
            }`}
          >
            {timeframe.label}
          </button>
        )
      })}
    </div>
  )
}
