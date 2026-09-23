import type {
  MarketAnalysis,
  MarketAnalysisContext,
  MarketVolatility,
} from "../../types/prices"
import { formatBs } from "../../utils/format"
import ResponsiveSheet from "../shared/ResponsiveSheet"
import { AlertIcon, RefreshIcon, SparkleIcon } from "./icons"
import { COLORS, priceChangeColor } from "./theme"

const VOLATILITY_LABELS: Record<MarketVolatility, string> = {
  low: "Baja",
  moderate: "Moderada",
  high: "Alta",
}

type Props = {
  open: boolean
  loading: boolean
  error: string | null
  analysis: MarketAnalysis | null
  context: MarketAnalysisContext | null
  cached: boolean
  onClose: () => void
  onRefresh: () => void
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-surface-raised motion-safe:animate-pulse-soft ${className}`}
      aria-hidden
    />
  )
}

function LoadingBody() {
  return (
    <div className="space-y-4" role="status" aria-label="Generando análisis">
      <Skeleton className="h-5 w-2/5" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[92%]" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="grid grid-cols-3 gap-3 pt-1">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-raised px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint">
        {label}
      </p>
      <p
        className="mt-0.5 truncate text-sm font-semibold tabular-nums"
        style={{ color: tone ?? COLORS.text }}
      >
        {value}
      </p>
    </div>
  )
}

/**
 * Panel de análisis del mercado (historial de precios).
 *
 * Usa ResponsiveSheet como cristal compartido: bottom sheet en móvil,
 * panel lateral en desktop. Todo el contenido llega como texto plano
 * ya saneado por Django: no se interpreta markdown ni HTML recibido
 * del modelo.
 */
export default function AiAnalysisPanel({
  open,
  loading,
  error,
  analysis,
  context,
  cached,
  onClose,
  onRefresh,
}: Props) {
  const summary = context?.summary ?? null

  const changePercent = summary?.change_percent ?? null

  const changeTone = priceChangeColor(changePercent)

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      ariaLabel="Análisis del mercado"
      icon={<SparkleIcon className="h-4 w-4 shrink-0 text-brand-light" />}
      title="Análisis del mercado"
      subtitle={
        context ? `${context.source_label} · generado con los datos del período` : undefined
      }
      footer={
        <>
          <span className="truncate text-[11px] text-ink-faint">
            {cached && !loading ? "Análisis guardado de este mismo período" : ""}
          </span>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-surface-raised px-3.5 text-xs font-semibold text-ink-soft outline-none transition hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.97] disabled:opacity-40"
          >
            <RefreshIcon className={loading ? "h-4 w-4 motion-safe:animate-spin" : "h-4 w-4"} />
            Actualizar análisis
          </button>
        </>
      }
    >
      {loading ? (
        <LoadingBody />
      ) : error ? (
        <div className="flex flex-col items-start gap-3 rounded-tile bg-surface-raised p-4">
          <AlertIcon className="h-5 w-5 text-warn" />
          <p className="text-sm text-ink-soft">{error}</p>
          <p className="text-xs text-ink-faint">
            El historial de precios sigue funcionando con normalidad.
          </p>
        </div>
      ) : analysis ? (
        <div className="motion-safe:animate-fade-in-fast">
          <h3 className="text-base font-bold leading-snug text-ink">{analysis.headline}</h3>

          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{analysis.summary}</p>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Metric
              label="Movimiento"
              value={
                changePercent === null
                  ? "—"
                  : `${changePercent >= 0 ? "+" : "−"}${Math.abs(changePercent).toFixed(2)}%`
              }
              tone={changeTone}
            />
            <Metric
              label="Rango"
              value={
                summary?.low != null && summary?.high != null
                  ? `${formatBs(summary.low)} – ${formatBs(summary.high)}`
                  : "—"
              }
            />
            <Metric label="Volatilidad" value={VOLATILITY_LABELS[analysis.volatility]} />
          </div>

          {analysis.highlights.length > 0 && (
            <ul className="mt-4 space-y-2">
              {analysis.highlights.map((highlight, index) => (
                <li key={index} className="flex gap-2.5 text-xs leading-relaxed text-ink-muted">
                  <span
                    aria-hidden
                    className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-brand"
                  />
                  {highlight}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 text-[11px] leading-relaxed text-ink-faint">
            Análisis generado automáticamente a partir de los precios registrados en el
            período. No es asesoría financiera ni una predicción.
          </p>
        </div>
      ) : null}
    </ResponsiveSheet>
  )
}
