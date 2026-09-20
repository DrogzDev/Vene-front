import type { P2PMarketAnalysis, P2PMarketSnapshot } from "../../types/prices"
import { formatBs, formatRelativeFromNow } from "../../utils/format"
import ResponsiveSheet from "../shared/ResponsiveSheet"
import { AlertIcon, RefreshIcon, SparkleIcon } from "../priceHistory/icons"
import { RISK_LABELS, TREND_LABELS, VOLATILITY_LABELS, riskColor, trendColor } from "./theme"

type Props = {
  open: boolean
  loading: boolean
  error: string | null
  analysis: P2PMarketAnalysis | null
  snapshot: P2PMarketSnapshot | null
  generatedAt: string | null
  onClose: () => void
  onAnalyze: (refresh: boolean) => void
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-white/[0.06] motion-safe:animate-pulse-soft ${className}`}
      aria-hidden
    />
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#646d7d]">
        {label}
      </p>
      <p
        className="mt-0.5 truncate text-sm font-semibold tabular-nums"
        style={{ color: tone ?? "#e9ebf0" }}
      >
        {value}
      </p>
    </div>
  )
}

/**
 * Drawer de "Análisis del mercado" P2P.
 *
 * A diferencia del análisis del historial de precios (que se dispara
 * al abrir el panel), aquí el pedido explícito es no ejecutar Qwen
 * automáticamente: el panel abre con un botón "Analizar mercado" y
 * solo llama al backend cuando el usuario lo pulsa.
 */
export default function P2PAiDrawer({
  open,
  loading,
  error,
  analysis,
  snapshot,
  generatedAt,
  onClose,
  onAnalyze,
}: Props) {
  const hasResult = Boolean(analysis && snapshot)

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      ariaLabel="Análisis del mercado"
      icon={<SparkleIcon className="h-4 w-4 shrink-0 text-[#a78bfa]" />}
      title="Análisis del mercado"
      subtitle="USDT P2P · Binance"
      footer={
        hasResult || error ? (
          <>
            <span className="truncate text-[11px] text-[#4d5665]">
              {generatedAt ? `Generado ${formatRelativeFromNow(generatedAt)}` : ""}
            </span>

            <button
              type="button"
              onClick={() => onAnalyze(true)}
              disabled={loading}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white/[0.06] px-3.5 text-xs font-semibold text-[#d7dbe3] outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-white/30 active:scale-[0.97] disabled:opacity-40"
            >
              <RefreshIcon className={loading ? "h-4 w-4 motion-safe:animate-spin" : "h-4 w-4"} />
              Analizar nuevamente
            </button>
          </>
        ) : undefined
      }
    >
      {loading ? (
        <div className="space-y-4" role="status" aria-label="Analizando mercado">
          <Skeleton className="h-5 w-2/5" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[92%]" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-white/[0.03] p-4">
          <AlertIcon className="h-5 w-5 text-[#f0b429]" />
          <p className="text-sm text-[#c9cfda]">{error}</p>
          <p className="text-xs text-[#646d7d]">
            El mercado P2P sigue funcionando con normalidad.
          </p>
        </div>
      ) : hasResult && analysis && snapshot ? (
        <div className="motion-safe:animate-fade-in-fast">
          <h3 className="text-base font-bold leading-snug text-[#e9ebf0]">{analysis.headline}</h3>

          <p className="mt-2 text-sm leading-relaxed text-[#a8b0be]">{analysis.summary}</p>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Metric
              label="Tendencia"
              value={TREND_LABELS[analysis.market_state]}
              tone={trendColor(analysis.market_state)}
            />
            <Metric
              label="Momentum 1H"
              value={
                snapshot.change_1h != null
                  ? `${snapshot.change_1h >= 0 ? "+" : ""}${snapshot.change_1h.toFixed(2)}%`
                  : "—"
              }
            />
            <Metric label="Volatilidad" value={VOLATILITY_LABELS[snapshot.volatility]} />
            <Metric
              label="Percentil 7D"
              value={snapshot.percentile_7d != null ? `${snapshot.percentile_7d}%` : "—"}
            />
            <Metric
              label="Desde máximo"
              value={
                snapshot.distance_from_high != null
                  ? `${snapshot.distance_from_high.toFixed(2)}%`
                  : "—"
              }
            />
            <Metric
              label="Spread vs BCV"
              value={snapshot.spread_percent != null ? `${snapshot.spread_percent.toFixed(2)}%` : "—"}
            />
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
            <span className="text-[11px] text-[#8b93a3]">Nivel de riesgo</span>
            <span
              className="text-[11px] font-semibold"
              style={{ color: riskColor(analysis.risk_level) }}
            >
              {RISK_LABELS[analysis.risk_level]}
            </span>
          </div>

          {analysis.observations.length > 0 && (
            <ul className="mt-4 space-y-2">
              {analysis.observations.map((observation, index) => (
                <li key={index} className="flex gap-2.5 text-xs leading-relaxed text-[#8b93a3]">
                  <span
                    aria-hidden
                    className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-[#a78bfa]"
                  />
                  {observation}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-[11px] tabular-nums text-[#4d5665]">
            Precio de referencia: Bs {formatBs(snapshot.current_price)}
          </p>

          <p className="mt-3 text-[11px] leading-relaxed text-[#4d5665]">
            Análisis generado automáticamente a partir de los datos del mercado.
            No es asesoría financiera ni una predicción; la decisión es tuya.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4 py-2">
          <p className="text-sm leading-relaxed text-[#a8b0be]">
            Genera un análisis del estado actual del mercado USDT/VES P2P a
            partir de los indicadores calculados por VeneCambio.
          </p>

          <button
            type="button"
            onClick={() => onAnalyze(false)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#a78bfa]/[0.14] px-4 text-sm font-semibold text-[#c4b5fd] outline-none transition duration-200 hover:bg-[#a78bfa]/[0.22] focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50 active:scale-[0.97]"
          >
            <SparkleIcon className="h-4 w-4" />
            Analizar mercado
          </button>
        </div>
      )}
    </ResponsiveSheet>
  )
}
