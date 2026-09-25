import type { P2PMarketSnapshot } from "../../types/prices"
import { formatBs } from "../../utils/format"
import { TREND_LABELS, VOLATILITY_LABELS, trendColor } from "./theme"
import { TONE_HEX } from "../ui/tone"

type Props = {
  snapshot: P2PMarketSnapshot
  /** Sin card ni título propios: va dentro de un bloque plegable. */
  embedded?: boolean
}

function Row({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[12px] text-ink-muted">{label}</span>
      <span className="text-[14px] font-bold tabular-nums" style={{ color: tone }}>
        {value}
      </span>
    </div>
  )
}

/**
 * "Estado del mercado": panel lateral en desktop, bloque debajo del
 * chart en móvil. Todos los valores salen del mismo snapshot que
 * consume el análisis con IA (api/services/p2p_history.py::build_market_snapshot).
 */
export default function MarketStatusPanel({ snapshot, embedded = false }: Props) {
  const trend = snapshot.trend
  const momentum1h = snapshot.change_1h

  return (
    <div className={embedded ? "" : "rounded-card border border-hair bg-surface p-4"}>
      {!embedded && (
        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
          Estado del mercado
        </h2>
      )}

      <div className="mt-1 divide-y divide-hair">
        <Row label="Tendencia" value={TREND_LABELS[trend]} tone={trendColor(trend)} />
        <Row
          label="Momentum 1H"
          value={momentum1h != null ? `${momentum1h >= 0 ? "+" : ""}${momentum1h.toFixed(2)}%` : "—"}
          tone={momentum1h != null ? (momentum1h >= 0 ? TONE_HEX.up : TONE_HEX.down) : TONE_HEX.neutral}
        />
        <Row
          label="Volatilidad"
          value={VOLATILITY_LABELS[snapshot.volatility]}
          tone="rgb(var(--c-text-primary))"
        />
        <Row
          label="Percentil 7D"
          value={snapshot.percentile_7d != null ? `${snapshot.percentile_7d}%` : "—"}
          tone="rgb(var(--c-text-primary))"
        />
        <Row
          label="Desde máximo"
          value={
            snapshot.distance_from_high != null
              ? `${snapshot.distance_from_high.toFixed(2)}%`
              : "—"
          }
          tone={TONE_HEX.down}
        />
        <Row
          label={`${snapshot.opposite_side === "BUY" ? "BUY" : "SELL"} (contrario)`}
          value={snapshot.opposite_price != null ? `Bs ${formatBs(snapshot.opposite_price)}` : "—"}
          tone="rgb(var(--c-text-primary))"
        />
        <Row
          label="Spread SELL-BUY"
          value={
            snapshot.spread_percent_market != null
              ? `${snapshot.spread_percent_market.toFixed(2)}%`
              : "—"
          }
          tone="rgb(var(--c-text-primary))"
        />
        <Row
          label="Premium vs BCV"
          value={snapshot.spread_percent != null ? `${snapshot.spread_percent.toFixed(2)}%` : "—"}
          tone="rgb(var(--c-text-primary))"
        />
        {snapshot.liquidity && (
          <Row
            label="Liquidez (top 10)"
            value={
              snapshot.liquidity.sell != null
                ? `${Math.round(snapshot.liquidity.sell).toLocaleString("es-VE")} USDT`
                : "—"
            }
            tone="rgb(var(--c-text-primary))"
          />
        )}
      </div>

      {snapshot.bcv_reference_price != null && (
        <p className="mt-2 text-[11px] text-ink-faint">
          Tasa BCV de referencia: Bs {formatBs(snapshot.bcv_reference_price)}
        </p>
      )}

      {snapshot.trend_insufficient_data && (
        <p className="mt-1 text-[11px] text-ink-faint">
          Todavía no hay suficiente historial para una tendencia confiable.
        </p>
      )}
    </div>
  )
}
