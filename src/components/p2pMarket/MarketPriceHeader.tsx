import type { P2PMarketSnapshot, P2PSide } from "../../types/prices"
import AnimatedPrice from "../ui/AnimatedPrice"
import { TrendBadge } from "../ui/primitives"

type Props = {
  snapshot: P2PMarketSnapshot | null
  loading: boolean
  /** Lado del snapshot pedido (SELL o BUY). */
  side: P2PSide
}

const captureFormatter = new Intl.DateTimeFormat("es-VE", {
  timeZone: "America/Caracas",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
})

/**
 * Precio de cabecera de Mercado (Simple y Profesional): precio actual,
 * variación 24 h y de qué captura sale. Las seis métricas viven ahora
 * debajo del gráfico (MarketStatsGrid), para que el gráfico asome antes.
 *
 * Mientras se recarga se mantiene el snapshot anterior SOLO si es del
 * mismo lado que se pide; si el lado cambió, se muestra "—" en vez de
 * enseñar el precio de otro lado bajo la etiqueta equivocada.
 */
export default function MarketPriceHeader({ snapshot, loading, side }: Props) {
  const ready = snapshot !== null && (!loading || snapshot.side === side)

  return (
    <section aria-label="Precio del mercado">
      <div className="flex items-end justify-between gap-3">
        <AnimatedPrice value={ready ? snapshot.current_price : null} size="lg" />
        {ready && (
          <div className="pb-0.5">
            <TrendBadge value={snapshot.change_24h} suffix="24h" />
          </div>
        )}
      </div>
      <p className="mt-1.5 truncate text-[12px] text-ink-muted">
        {ready && snapshot.current_price_at
          ? `Captura del ${captureFormatter.format(new Date(snapshot.current_price_at)).replace(".", "")} · ${snapshot.side} a ${Math.round(snapshot.amount_usdt)} USDT`
          : "Cargando la última captura…"}
      </p>
    </section>
  )
}
