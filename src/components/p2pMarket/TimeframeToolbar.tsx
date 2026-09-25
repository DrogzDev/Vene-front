import { useEffect, useRef } from "react"

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
  const containerRef = useRef<HTMLDivElement | null>(null)

  // En 360 px no caben las siete temporalidades: la activa se trae a la
  // vista para que nunca quede escondida al final de la fila.
  useEffect(() => {
    const active = containerRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')
    const container = containerRef.current

    // Solo se desplaza la fila, nunca la página.
    if (active && container) {
      container.scrollLeft = active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2
    }
  }, [value, timeframes])

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Timeframe"
      className="no-scrollbar relative -mx-1 flex snap-x gap-1 overflow-x-auto px-1"
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
            className={`h-9 min-w-[42px] shrink-0 snap-start rounded-[10px] px-3 text-[13px] font-semibold tabular-nums outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-gold/40 active:scale-95 ${
              isActive
                ? "bg-gold/[0.12] text-gold-ink ring-1 ring-inset ring-gold/30"
                : timeframe.available
                  ? "text-ink-muted hover:bg-surface-raised hover:text-ink-soft"
                  : "cursor-not-allowed text-ink-faint/60"
            }`}
          >
            {timeframe.label}
          </button>
        )
      })}
    </div>
  )
}
