import type { P2PMarketSnapshot, P2PViewMode } from "../../types/prices"
import { formatBs } from "../../utils/format"
import { ArrowDownIcon, ArrowUpIcon, ChevronLeftIcon, MinusIcon, SparkleIcon } from "../priceHistory/icons"
import ViewModeToggle from "./ViewModeToggle"

type Props = {
  snapshot: P2PMarketSnapshot | null
  loading: boolean
  viewMode: P2PViewMode
  onViewModeChange: (mode: P2PViewMode) => void
  onBack: () => void
  onOpenAi: () => void
  aiAvailable: boolean
}

function StatCell({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "up" | "down" | "neutral"
}) {
  const toneClass =
    tone === "up" ? "text-[#34d399]" : tone === "down" ? "text-[#f87171]" : "text-[#d7dbe3]"

  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-[#646d7d]">
        {label}
      </p>
      <p className={`mt-0.5 truncate text-[13px] font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  )
}

/**
 * Header de la Vista Profesional: precio + cambio 24h protagonistas,
 * cuatro celdas compactas de contexto y el acceso a Simple/IA.
 *
 * No existe captura histórica de BUY (ver api/services/p2p_history.py):
 * en vez de inventar un precio de compra, la segunda celda compara el
 * único precio real (SELL) contra la tasa BCV real más reciente.
 */
export default function ProHeader({
  snapshot,
  loading,
  viewMode,
  onViewModeChange,
  onBack,
  onOpenAi,
  aiAvailable,
}: Props) {
  const change24h = snapshot?.change_24h ?? null
  const isUp = (change24h ?? 0) > 0
  const isDown = (change24h ?? 0) < 0
  const changeColor = isUp ? "#34d399" : isDown ? "#f87171" : "#8b93a3"
  const ChangeIcon = isUp ? ArrowUpIcon : isDown ? ArrowDownIcon : MinusIcon

  return (
    <header className="border-b border-white/[0.05] px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-[#c9cfda] outline-none transition duration-200 hover:border-white/15 hover:bg-white/[0.07] hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
        >
          <ChevronLeftIcon className="h-[18px] w-[18px]" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold tracking-tight text-[#e9ebf0]">
            USDT / VES
          </h1>
          <p className="truncate text-[11px] text-[#646d7d]">Mercado P2P · Binance</p>
        </div>

        <ViewModeToggle value={viewMode} onChange={onViewModeChange} className="w-[188px]" />

        {aiAvailable && (
          <button
            type="button"
            onClick={onOpenAi}
            aria-label="Análisis del mercado"
            className="hidden h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#a78bfa]/25 bg-[#a78bfa]/[0.09] px-3 text-xs font-semibold text-[#c4b5fd] outline-none transition duration-200 hover:border-[#a78bfa]/45 hover:bg-[#a78bfa]/[0.16] focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50 active:scale-[0.97] sm:inline-flex"
          >
            <SparkleIcon className="h-3.5 w-3.5" />
            IA
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
        <p className="text-[1.75rem] font-bold leading-none tracking-tight tabular-nums text-[#e9ebf0] sm:text-[2.25rem]">
          <span className="mr-1 text-[0.5em] font-semibold text-[#8b93a3]">Bs</span>
          {loading || !snapshot ? "—" : formatBs(snapshot.current_price)}
        </p>

        {snapshot && change24h !== null && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
            style={{ color: changeColor, backgroundColor: `${changeColor}1a` }}
          >
            <ChangeIcon />
            {Math.abs(change24h).toFixed(2)}%
            <span className="font-normal opacity-70">24h</span>
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4">
        <StatCell
          label="SELL P2P"
          value={snapshot ? `Bs ${formatBs(snapshot.current_price)}` : "—"}
        />
        <StatCell
          label="Spread vs BCV"
          value={
            snapshot?.spread_percent != null
              ? `${snapshot.spread_percent >= 0 ? "+" : ""}${snapshot.spread_percent.toFixed(2)}%`
              : "—"
          }
        />
        <StatCell
          label="Máximo 24H"
          value={snapshot ? `Bs ${formatBs(snapshot.high)}` : "—"}
          tone="up"
        />
        <StatCell
          label="Mínimo 24H"
          value={snapshot ? `Bs ${formatBs(snapshot.low)}` : "—"}
          tone="down"
        />
      </div>
    </header>
  )
}
