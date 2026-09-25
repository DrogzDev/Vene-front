export type IndicatorKey = "ma7" | "ma25" | "ma99"

const INDICATOR_OPTIONS: { key: IndicatorKey; label: string; color: string }[] = [
  { key: "ma7", label: "MA 7", color: "#38bdf8" },
  { key: "ma25", label: "MA 25", color: "#facc15" },
  { key: "ma99", label: "MA 99", color: "#DCC9A6" },
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
    // Scroller horizontal y no una fila rígida: con el selector de
    // gráfico al lado, tres chips que no encogen desbordaban la página
    // en pantallas de 360-411 px. Y un desbordamiento horizontal no es
    // solo feo: el WebView de Android se aleja para encajarlo, lo que
    // agranda el viewport de layout y deja la navegación inferior fija
    // por debajo de la pantalla visible.
    <div
      className="no-scrollbar flex min-w-0 snap-x items-center gap-1.5 overflow-x-auto"
      role="group"
      aria-label="Indicadores"
    >
      {INDICATOR_OPTIONS.map((option) => {
        const isActive = active.has(option.key)

        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(option.key)}
            className={`inline-flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-[10px] border px-3 text-[12px] font-semibold outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-95 ${
              isActive
                ? "border-transparent bg-white/[0.08] text-white"
                : "border-hair text-ink-faint hover:text-ink-soft"
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
