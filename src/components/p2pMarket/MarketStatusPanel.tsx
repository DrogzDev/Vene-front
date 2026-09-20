import type { P2PMarketSnapshot } from "../../types/prices"
import { formatBs } from "../../utils/format"
import { TREND_LABELS, VOLATILITY_LABELS, trendColor } from "./theme"

type Props = {
  snapshot: P2PMarketSnapshot
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
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-xs text-[#8b93a3]">{label}</span>
      <span className="text-sm font-semibold tabular-nums" style={{ color: tone }}>
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
export default function MarketStatusPanel({ snapshot }: Props) {
  const trend = snapshot.trend
  const momentum1h = snapshot.change_1h

  return (
    <div className="rounded-[16px] border border-white/[0.06] bg-[#12151c] p-4">
      <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-[#8b93a3]">
        Estado del mercado
      </h2>

      <div className="mt-1 divide-y divide-white/[0.05]">
        <Row label="Tendencia" value={TREND_LABELS[trend]} tone={trendColor(trend)} />
        <Row
          label="Momentum 1H"
          value={momentum1h != null ? `${momentum1h >= 0 ? "+" : ""}${momentum1h.toFixed(2)}%` : "—"}
          tone={momentum1h != null ? (momentum1h >= 0 ? "#34d399" : "#f87171") : "#d7dbe3"}
        />
        <Row
          label="Volatilidad"
          value={VOLATILITY_LABELS[snapshot.volatility]}
          tone="#d7dbe3"
        />
        <Row
          label="Percentil 7D"
          value={snapshot.percentile_7d != null ? `${snapshot.percentile_7d}%` : "—"}
          tone="#d7dbe3"
        />
        <Row
          label="Desde máximo"
          value={
            snapshot.distance_from_high != null
              ? `${snapshot.distance_from_high.toFixed(2)}%`
              : "—"
          }
          tone="#f87171"
        />
        <Row
          label="Spread vs BCV"
          value={snapshot.spread_percent != null ? `${snapshot.spread_percent.toFixed(2)}%` : "—"}
          tone="#d7dbe3"
        />
      </div>

      {snapshot.bcv_reference_price != null && (
        <p className="mt-2 text-[11px] text-[#4d5665]">
          Tasa BCV de referencia: Bs {formatBs(snapshot.bcv_reference_price)}
        </p>
      )}

      {snapshot.trend_insufficient_data && (
        <p className="mt-1 text-[11px] text-[#4d5665]">
          Todavía no hay suficiente historial para una tendencia confiable.
        </p>
      )}
    </div>
  )
}
