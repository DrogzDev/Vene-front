import { ChartColumn } from "lucide-react"

import type { P2PMarketSnapshot } from "../../types/prices"
import { formatBs } from "../../utils/format"
import { Disclosure, MetricCell, MetricGrid } from "../ui/primitives"
import { formatSignedPercent } from "../ui/tone"

function percent(value: number | null | undefined) {
  return value == null ? "—" : formatSignedPercent(value)
}

function bs(value: number | null | undefined) {
  return value == null ? "—" : formatBs(value)
}

/**
 * Las seis métricas del mercado de las últimas 24 h, plegadas debajo
 * del gráfico. Cerrado, el subtítulo resume SELL, BUY y spread; al
 * abrirlo aparece la rejilla completa. Todo sale de /p2p/market-status/;
 * un dato ausente se muestra como "—", nunca como un número de relleno.
 */
export default function MarketStatsDisclosure({ snapshot }: { snapshot: P2PMarketSnapshot | null }) {
  return (
    <Disclosure
      title="Estadísticas 24 h"
      subtitle={`Sell ${bs(snapshot?.sell_price)} · Buy ${bs(snapshot?.buy_price)} · Spread ${percent(snapshot?.spread_percent_market)}`}
      icon={<ChartColumn className="h-[18px] w-[18px] shrink-0 text-ink-muted" aria-hidden />}
    >
      <MetricGrid columns={3}>
        <MetricCell label="Sell" value={bs(snapshot?.sell_price)} />
        <MetricCell label="Buy" value={bs(snapshot?.buy_price)} />
        <MetricCell label="Spread" value={percent(snapshot?.spread_percent_market)} />
        <MetricCell label="Máx 24h" value={bs(snapshot?.high)} tone="up" />
        <MetricCell label="Mín 24h" value={bs(snapshot?.low)} tone="down" />
        <MetricCell label="Prima BCV" value={percent(snapshot?.spread_percent)} />
      </MetricGrid>
    </Disclosure>
  )
}
