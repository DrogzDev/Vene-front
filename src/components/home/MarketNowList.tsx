import { ChevronRight, RefreshCw } from "lucide-react"

import type { PricesHomeData } from "../../types/prices"
import { formatBs } from "../../utils/format"
import HistoryDatePicker from "../HistoryDatePicker"
import Sparkline from "../ui/Sparkline"
import { CurrencyIcon } from "../ui/VcIcon"
import type { CurrencyIconName } from "../ui/VcIcon"
import { SectionHeader, SeeAllButton } from "../ui/primitives"
import { TONE_HEX, TONE_TEXT, formatSignedPercent, toneOf } from "../ui/tone"
import type { HomeMarket } from "./useHomeMarket"

type Props = {
  data: PricesHomeData
  market: HomeMarket
  onSeeAll: () => void
  onUsdtClick: () => void
}

type TileProps = {
  icon: CurrencyIconName
  accent: string
  title: string
  value: number | null
  changePercent: number | null
  trend: number[]
  onClick?: () => void
}

/**
 * Tasa compacta: icono + nombre, precio y variación con mini tendencia.
 * El precio nunca baja de 15 px: si no cabe, la rejilla pasa a dos
 * columnas en vez de encoger la cifra.
 */
function RateTile({ icon, accent, title, value, changePercent, trend, onClick }: TileProps) {
  const tone = toneOf(changePercent)

  const body = (
    <>
      <span className="flex items-center gap-1.5">
        <CurrencyIcon name={icon} className="h-5 w-5" />
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink-soft">{title}</span>
        {onClick && <ChevronRight className="-mr-1 h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />}
      </span>

      <span className="mt-1.5 block truncate text-[15px] font-bold leading-tight tabular-nums text-ink">
        {value == null || !Number.isFinite(value) ? (
          "—"
        ) : (
          <>
            <span className="mr-0.5 text-[11px] font-semibold text-ink-muted">Bs</span>
            {formatBs(value)}
          </>
        )}
      </span>

      <span className="mt-1 flex h-4 items-center justify-between gap-1.5">
        {changePercent != null ? (
          <span className={`text-[11px] font-semibold tabular-nums ${TONE_TEXT[tone]}`}>
            {formatSignedPercent(changePercent)}
          </span>
        ) : (
          <span />
        )}
        <Sparkline values={trend} color={changePercent == null ? accent : TONE_HEX[tone]} width={40} height={16} />
      </span>
    </>
  )

  const shell = "block min-w-0 bg-surface px-2.5 py-2.5 text-left"

  if (!onClick) return <div className={shell}>{body}</div>

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${shell} outline-none transition-colors duration-150 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50 active:bg-surface-raised`}
    >
      {body}
    </button>
  )
}

/**
 * "Mercado ahora": las tres tasas de referencia en una rejilla compacta
 * que se lee de un vistazo. Una sola superficie con separadores finos,
 * no tres cards. El resto (euro, ofertas, histórico) está a un toque.
 */
export default function MarketNowList({ data, market, onSeeAll, onUsdtClick }: Props) {
  const display = market.displayData ?? data

  return (
    <section aria-label="Mercado ahora">
      <SectionHeader
        title="Mercado ahora"
        action={
          <>
            <HistoryDatePicker
              variant="icon"
              selectedDate={market.selectedDate}
              onConfirm={market.selectHistoricalDate}
              availableDates={market.availableDates}
              loading={market.historyLoading}
            />
            <button
              type="button"
              onClick={market.refresh}
              disabled={market.refreshing}
              aria-label={market.refreshing ? "Actualizando tasas" : "Actualizar tasas"}
              title="Actualizar tasas"
              className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted outline-none transition duration-150 hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-95 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-[18px] w-[18px] ${market.refreshing ? "motion-safe:animate-spin" : ""}`}
                strokeWidth={2}
                aria-hidden
              />
            </button>
            <SeeAllButton onClick={onSeeAll} />
          </>
        }
      />

      {/* Tres columnas desde 360 px; por debajo, dos (la cifra no encoge). */}
      <div className="mt-1 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-hair bg-hair max-[359px]:[&>*:last-child]:col-span-2 min-[360px]:grid-cols-3">
        <RateTile
          icon="bcv"
          accent="#3AA8FF"
          title="BCV"
          value={display.bcv.USD}
          changePercent={market.changes.bcv}
          trend={market.trends.bcv}
        />
        <RateTile
          icon="usdt"
          accent="#1FBF9F"
          title="USDT"
          value={display.binance_best_price}
          changePercent={market.changes.usdt}
          trend={market.trends.usdt}
          onClick={onUsdtClick}
        />
        <RateTile
          icon="average"
          accent="#9D72FF"
          title="Promedio"
          value={display.average_price}
          changePercent={market.changes.average}
          trend={market.trends.average}
        />
      </div>

      {market.historyError && (
        <p className="mt-2 px-1 text-[12px] text-warn">{market.historyError}</p>
      )}
    </section>
  )
}
