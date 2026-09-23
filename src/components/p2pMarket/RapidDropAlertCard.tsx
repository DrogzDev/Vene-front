import type { P2PMarketSnapshot, P2PRapidDropAlert } from "../../types/prices"
import { formatBs } from "../../utils/format"
import { AlertIcon, ArrowDownIcon } from "../priceHistory/icons"

type Props = {
  alert: P2PRapidDropAlert
  snapshot: P2PMarketSnapshot
  onViewAnalysis: () => void
}

/**
 * Alerta de "caída rápida" (rapid_drop): un movimiento brusco en una
 * ventana corta y concreta. Es distinta de una tendencia bajista
 * sostenida (downtrend) — ver api/services/market_indicators.py — y
 * por eso siempre se muestra junto al intervalo exacto en el que
 * ocurrió, nunca como un genérico "cayó X%".
 *
 * Solo informa: no incluye ninguna instrucción de compra/venta.
 *
 * Va en el color de "baja" del mercado (rojo, ver PRICE).
 */
export default function RapidDropAlertCard({ alert, snapshot, onViewAnalysis }: Props) {
  return (
    <div className="rounded-tile border border-fall/25 bg-fall/[0.08] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-fall/15 text-fall">
          <ArrowDownIcon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-fall">
            <AlertIcon className="h-3.5 w-3.5" />
            Caída fuerte detectada
          </p>

          <p className="mt-1 text-xs text-ink-soft">
            <span className="font-semibold tabular-nums">
              {alert.change_percent.toFixed(2)}%
            </span>{" "}
            durante los últimos {alert.elapsed_minutes} min ({alert.window_label})
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.08em] text-ink-muted">
                Precio actual
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
                Bs {formatBs(snapshot.current_price)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.08em] text-ink-muted">
                Desde máximo
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-fall">
                {snapshot.distance_from_high != null
                  ? `${snapshot.distance_from_high.toFixed(2)}%`
                  : "—"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewAnalysis}
            className="mt-3 text-xs font-semibold text-brand-light outline-none transition hover:text-brand-light focus-visible:underline"
          >
            Ver análisis
          </button>
        </div>
      </div>
    </div>
  )
}
