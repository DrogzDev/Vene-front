import type {
  FxSupplyContext,
  HourBucket,
  IntradayBestHours,
  P2PMarketAnalysis,
  P2PMarketSnapshot,
} from "../../types/prices"
import { formatBs, formatRelativeFromNow } from "../../utils/format"
import ResponsiveSheet from "../shared/ResponsiveSheet"
import {
  AlertIcon,
  ClockIcon,
  HistoryIcon,
  RefreshIcon,
  SparkleIcon,
} from "../priceHistory/icons"
import { RISK_LABELS, TREND_LABELS, VOLATILITY_LABELS, riskColor, trendColor } from "./theme"

type Props = {
  open: boolean
  loading: boolean
  /** Verdadero mientras llegan tokens del modelo. Dibuja el cursor. */
  streaming: boolean
  error: string | null
  analysis: P2PMarketAnalysis | null
  /** Texto parcial que se va concatenando conforme llega el stream. */
  streamedText: string
  snapshot: P2PMarketSnapshot | null
  intraday: IntradayBestHours | null
  fxSupply: FxSupplyContext | null
  generatedAt: string | null
  cached: boolean
  onClose: () => void
  onAnalyze: (force: boolean) => void
  onOpenHistory: () => void
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
 * Franja observada hoy.
 *
 * El texto dice "observada hoy" a propósito: es una lectura de lo que
 * ya ocurrió, no una recomendación de a qué hora operar mañana.
 */
function BestHour({
  label,
  bucket,
}: {
  label: string
  bucket: HourBucket | null
}) {
  return (
    <div className="min-w-0 rounded-xl bg-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#646d7d]">
        {label}
      </p>

      {bucket ? (
        <>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#d7dbe3]">
            {bucket.hour_start}–{bucket.hour_end}
          </p>
          <p className="mt-0.5 text-[11px] tabular-nums text-[#4d5665]">
            Bs {formatBs(bucket.median_price)} · {bucket.sample_count} lecturas
          </p>
        </>
      ) : (
        <p className="mt-0.5 text-sm font-semibold text-[#4d5665]">
          Sin datos suficientes
        </p>
      )}
    </div>
  )
}

/**
 * Narrativa en curso o terminada.
 *
 * Los párrafos se parten por línea en blanco y se renderizan como nodos
 * de texto: nada de markdown ni de innerHTML. El backend ya entrega el
 * texto limpio, y aquí tampoco se interpreta nada de lo que llegue.
 */
function Narrative({
  text,
  streaming,
}: {
  text: string
  streaming: boolean
}) {
  const paragraphs = text.split("\n\n").filter(Boolean)

  return (
    <div>
      {paragraphs.map((paragraph, index) => {
        const isLast = index === paragraphs.length - 1

        return (
          <p
            key={index}
            className={`text-sm leading-relaxed text-[#a8b0be] ${
              index === 0 ? "" : "mt-3"
            }`}
          >
            {paragraph}
            {streaming && isLast && (
              <span
                aria-hidden
                className="ml-0.5 inline-block motion-safe:animate-cursor-blink"
              >
                ▋
              </span>
            )}
          </p>
        )
      })}
    </div>
  )
}

/**
 * Drawer de "Análisis del mercado" P2P.
 *
 * El análisis no se dispara al abrir: el panel abre con un botón y solo
 * llama al backend cuando el usuario lo pulsa.
 *
 * La narrativa llega por streaming y se escribe sola a la velocidad
 * real del modelo. No hay setInterval ni escritura simulada: si el
 * texto ya estaba guardado, aparece de golpe, que es justo la señal de
 * que no se gastó una inferencia.
 */
export default function P2PAiDrawer({
  open,
  loading,
  streaming,
  error,
  analysis,
  streamedText,
  snapshot,
  intraday,
  fxSupply,
  generatedAt,
  cached,
  onClose,
  onAnalyze,
  onOpenHistory,
}: Props) {
  const text = analysis?.summary || streamedText
  const headline = analysis?.headline ?? ""
  const hasContent = Boolean(text || headline)
  const hasMetrics = Boolean(snapshot)

  // El skeleton solo se ve hasta que llegan las métricas; en cuanto
  // Django las manda (antes del primer token) se pintan las tarjetas.
  const showSkeleton = loading && !hasMetrics

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      ariaLabel="Análisis del mercado"
      icon={<SparkleIcon className="h-4 w-4 shrink-0 text-[#a78bfa]" />}
      title="Análisis del mercado"
      subtitle={
        snapshot
          ? `USDT P2P · ${snapshot.side} · ${snapshot.notional_selected} USDT`
          : "USDT P2P · Binance"
      }
      footer={
        hasMetrics || error ? (
          <>
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-[#c4b5fd] outline-none transition hover:text-[#ddd6fe] focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50 active:scale-[0.97]"
            >
              <HistoryIcon className="h-4 w-4" />
              Ver historial
            </button>

            <button
              type="button"
              onClick={() => onAnalyze(true)}
              disabled={loading}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white/[0.06] px-3.5 text-xs font-semibold text-[#d7dbe3] outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-white/30 active:scale-[0.97] disabled:opacity-40"
            >
              <RefreshIcon className={loading ? "h-4 w-4 motion-safe:animate-spin" : "h-4 w-4"} />
              Actualizar análisis
            </button>
          </>
        ) : undefined
      }
    >
      {showSkeleton ? (
        <div className="space-y-4" role="status" aria-label="Analizando mercado">
          <p className="text-sm text-[#a8b0be]">Analizando mercado…</p>
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
      ) : error && !hasContent ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-white/[0.03] p-4">
          <AlertIcon className="h-5 w-5 text-[#f0b429]" />
          <p className="text-sm text-[#c9cfda]">{error}</p>
          <p className="text-xs text-[#646d7d]">
            El mercado P2P sigue funcionando con normalidad.
          </p>
        </div>
      ) : hasMetrics && snapshot ? (
        <div className="motion-safe:animate-fade-in-fast">
          {headline ? (
            <h3 className="text-base font-bold leading-snug text-[#e9ebf0]">
              {headline}
            </h3>
          ) : streaming && !text ? (
            <p className="text-sm text-[#8b93a3]">Analizando mercado…</p>
          ) : null}

          {text && (
            <div className={headline ? "mt-2" : ""}>
              <Narrative text={text} streaming={streaming} />
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Metric
              label="Tendencia"
              value={TREND_LABELS[snapshot.trend]}
              tone={trendColor(snapshot.trend)}
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

          {analysis && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
              <span className="text-[11px] text-[#8b93a3]">Nivel de riesgo</span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: riskColor(analysis.risk_level) }}
              >
                {RISK_LABELS[analysis.risk_level]}
              </span>
            </div>
          )}

          {intraday && (intraday.best_buy_hour || intraday.best_sell_hour) && (
            <div className="mt-4">
              <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#646d7d]">
                <ClockIcon className="h-3 w-3" />
                Mejor hora observada hoy
              </p>

              <div className="mt-2 grid grid-cols-2 gap-2.5">
                <BestHour label="Comprar" bucket={intraday.best_buy_hour} />
                <BestHour label="Vender" bucket={intraday.best_sell_hour} />
              </div>
            </div>
          )}

          {fxSupply && Object.keys(fxSupply).length > 0 && (
            <div className="mt-4 rounded-xl bg-white/[0.03] px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#646d7d]">
                Oferta de divisas
              </p>

              {Object.values(fxSupply).map((state) => (
                <p
                  key={state.institution}
                  className="mt-1 flex items-baseline justify-between gap-3 text-[11px]"
                >
                  <span className="text-[#8b93a3]">{state.label}</span>
                  <span className="text-[#d7dbe3]">
                    {state.first_event_time
                      ? `Registrada ${state.first_event_time}`
                      : state.monitoring_closed
                        ? "Sin registrar hoy"
                        : `Monitoreando hasta ${state.monitor_until}`}
                  </span>
                </p>
              ))}
            </div>
          )}

          {error && hasContent && (
            <p className="mt-4 rounded-xl bg-[#2a1414]/60 px-3 py-2.5 text-xs leading-relaxed text-[#fca5a5]">
              El análisis se interrumpió. Intenta nuevamente.
            </p>
          )}

          <p className="mt-4 text-[11px] tabular-nums text-[#4d5665]">
            Precio de referencia: Bs {formatBs(snapshot.current_price)}
            {generatedAt ? ` · ${formatRelativeFromNow(generatedAt)}` : ""}
            {cached ? " · análisis guardado" : ""}
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onAnalyze(false)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#a78bfa]/[0.14] px-4 text-sm font-semibold text-[#c4b5fd] outline-none transition duration-200 hover:bg-[#a78bfa]/[0.22] focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50 active:scale-[0.97]"
            >
              <SparkleIcon className="h-4 w-4" />
              Analizar mercado
            </button>

            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#8b93a3] outline-none transition hover:text-[#c4b5fd] focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50 active:scale-[0.97]"
            >
              <HistoryIcon className="h-4 w-4" />
              Ver historial
            </button>
          </div>
        </div>
      )}
    </ResponsiveSheet>
  )
}
