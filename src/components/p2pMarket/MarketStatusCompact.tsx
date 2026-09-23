import { useState } from "react"
import { Activity } from "lucide-react"

import type { P2PMarketSnapshot } from "../../types/prices"
import ResponsiveSheet from "../shared/ResponsiveSheet"
import { SeeAllButton } from "../ui/primitives"
import { TONE_TEXT, formatSignedPercent } from "../ui/tone"
import type { Tone } from "../ui/tone"
import MarketStatusPanel from "./MarketStatusPanel"
import { TREND_LABELS, VOLATILITY_LABELS } from "./theme"

function percent(value: number | null | undefined) {
  return value == null ? "—" : formatSignedPercent(value)
}

function Reading({ label, value, tone = "neutral" }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] font-medium text-ink-faint">{label}</p>
      <p className={`truncate text-[14px] font-bold tabular-nums ${tone === "neutral" ? "text-ink" : TONE_TEXT[tone]}`}>
        {value}
      </p>
    </div>
  )
}

/**
 * "Estado del mercado": una card con las seis lecturas clave en dos
 * columnas; "Ver más" abre el panel completo. Todos los valores vienen
 * del mismo snapshot de /p2p/market-status/.
 */
export default function MarketStatusCompact({ snapshot }: { snapshot: P2PMarketSnapshot }) {
  const [open, setOpen] = useState(false)

  const trendKnown = !snapshot.trend_insufficient_data
  const momentum = snapshot.change_1h
  const liquidity = snapshot.liquidity?.sell ?? null

  return (
    <section aria-label="Estado del mercado" className="rounded-card border border-hair bg-surface px-4 pb-3.5 pt-1.5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold tracking-tight text-ink">Estado del mercado</h2>
        <SeeAllButton label="Ver más" onClick={() => setOpen(true)} />
      </div>

      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2.5">
        <Reading
          label="Tendencia"
          value={trendKnown ? TREND_LABELS[snapshot.trend] : "Sin historial"}
          tone={!trendKnown ? "neutral" : snapshot.trend === "bullish" ? "up" : snapshot.trend === "bearish" ? "down" : "neutral"}
        />
        <Reading label="Prima vs BCV" value={percent(snapshot.spread_percent)} />
        <Reading
          label="Momentum 1H"
          value={percent(momentum)}
          tone={momentum == null || momentum === 0 ? "neutral" : momentum > 0 ? "up" : "down"}
        />
        <Reading label="Spread SELL-BUY" value={percent(snapshot.spread_percent_market)} />
        <Reading label="Volatilidad" value={VOLATILITY_LABELS[snapshot.volatility]} />
        <Reading
          label="Liquidez (top 10)"
          value={liquidity == null ? "—" : `${Math.round(liquidity).toLocaleString("es-VE")} USDT`}
        />
      </div>

      <ResponsiveSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Estado del mercado"
        subtitle="Lecturas calculadas con capturas reales"
        icon={<Activity className="h-4 w-4 shrink-0 text-brand-light" aria-hidden />}
      >
        <MarketStatusPanel snapshot={snapshot} embedded />
      </ResponsiveSheet>
    </section>
  )
}
