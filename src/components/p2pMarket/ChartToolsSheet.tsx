import type { ReactNode } from "react"
import { RotateCcw, SlidersHorizontal } from "lucide-react"

import ResponsiveSheet from "../shared/ResponsiveSheet"
import SegmentedControl from "../priceHistory/SegmentedControl"
import { Eyebrow } from "../ui/primitives"
import IndicatorsMenu from "./IndicatorsMenu"
import type { IndicatorKey } from "./IndicatorsMenu"
import type { P2PChartMode } from "./P2PProChart"

const CHART_MODE_OPTIONS: { key: P2PChartMode; label: string }[] = [
  { key: "candles", label: "Velas" },
  { key: "line", label: "Línea" },
]

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="border-b border-hair py-4 first:pt-1 last:border-b-0">
      <Eyebrow>{title}</Eyebrow>
      <div className="mt-2.5">{children}</div>
      {hint && <p className="mt-2 text-[12px] leading-snug text-ink-muted">{hint}</p>}
    </div>
  )
}

/**
 * Herramientas avanzadas del gráfico profesional: tamaño de operación,
 * tipo de gráfico y medias móviles. Viven en un sheet para que el
 * gráfico quede arriba en la pantalla.
 */
export default function ChartToolsSheet({
  open,
  onClose,
  notional,
  notionalLevels,
  onNotionalChange,
  referenceNotional,
  chartMode,
  onChartModeChange,
  modeLocked,
  indicatorsAvailable,
  activeIndicators,
  onToggleIndicator,
  onResetZoom,
}: {
  open: boolean
  onClose: () => void
  notional: number
  notionalLevels: number[]
  onNotionalChange: (value: number) => void
  referenceNotional: number
  chartMode: P2PChartMode
  onChartModeChange: (mode: P2PChartMode) => void
  /** En "Ambos" el gráfico va siempre en línea. */
  modeLocked: boolean
  indicatorsAvailable: boolean
  activeIndicators: IndicatorKey[]
  onToggleIndicator: (key: IndicatorKey) => void
  onResetZoom: () => void
}) {
  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      title="Herramientas del gráfico"
      subtitle="Monto, tipo de gráfico e indicadores"
      icon={<SlidersHorizontal className="h-4 w-4 shrink-0 text-brand-light" aria-hidden />}
    >
      <Group
        title="Tamaño de operación"
        hint={
          notional === referenceNotional
            ? "Mejor anuncio disponible, con el historial más largo."
            : "Precio ponderado real para ese monto; su historial es más reciente."
        }
      >
        <div role="radiogroup" aria-label="Tamaño de operación" className="grid grid-cols-4 gap-1.5">
          {notionalLevels.map((level) => {
            const active = level === notional

            return (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onNotionalChange(level)}
                className={`h-11 rounded-ctl text-[13px] font-semibold tabular-nums outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-brand/50 ${
                  active
                    ? "bg-brand/15 text-brand-light ring-1 ring-inset ring-brand/40"
                    : "border border-hair bg-surface-raised text-ink-muted hover:text-ink-soft"
                }`}
              >
                {level}
              </button>
            )
          })}
        </div>
      </Group>

      <Group title="Tipo de gráfico" hint={modeLocked ? "Con SELL y BUY a la vez el gráfico se muestra en línea." : undefined}>
        {modeLocked ? (
          <p className="text-[13px] text-ink-soft">Línea</p>
        ) : (
          <SegmentedControl options={CHART_MODE_OPTIONS} value={chartMode} onChange={onChartModeChange} label="Tipo de gráfico" size="sm" />
        )}
      </Group>

      <Group
        title="Medias móviles"
        hint={indicatorsAvailable ? undefined : "Disponibles con un solo lado y el monto de referencia."}
      >
        {indicatorsAvailable ? (
          <IndicatorsMenu active={new Set(activeIndicators)} onToggle={onToggleIndicator} />
        ) : (
          <p className="text-[13px] text-ink-faint">No disponibles con esta combinación.</p>
        )}
      </Group>

      <Group title="Vista">
        <button
          type="button"
          onClick={() => {
            onResetZoom()
            onClose()
          }}
          className="flex min-h-11 items-center gap-2 rounded-ctl border border-hair bg-surface-raised px-4 text-[13px] font-semibold text-ink-soft outline-none transition hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Restablecer zoom
        </button>
      </Group>
    </ResponsiveSheet>
  )
}
