import type { ReactNode } from "react"

import type {
  FxSupplyContext,
  FxSupplyPressure,
  FxSupplyStage,
  FxSupplyStatus,
  HourBucket,
  InterventionEffect,
  IntradayBestHours,
  MarketReading,
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
import { TrendBadge } from "../ui/primitives"
import { TONE_TEXT, formatSignedPercent, toneOf } from "../ui/tone"
import { VcIcon } from "../ui/VcIcon"
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
  /** Oferta bancaria + reacción del mercado, calculada por Django. */
  reading: MarketReading | null
  generatedAt: string | null
  cached: boolean
  onClose: () => void
  onAnalyze: (force: boolean) => void
  onOpenHistory: () => void
}

// ---------------------------------------------------------------------
// Etiquetas
// ---------------------------------------------------------------------

/**
 * Impacto cambiario, separado a propósito del color del mercado: que
 * USDT/VES suba se ve verde en el badge (movimiento del mercado) y aquí
 * se dice que el bolívar se debilita.
 */
const BOLIVAR_STATUS = {
  weakening: { label: "Presión sobre el bolívar", className: "border-warn/30 bg-warn/10 text-warn" },
  strengthening: { label: "Alivio sobre el bolívar", className: "border-up/30 bg-up/10 text-up" },
  stable: { label: "Bolívar estable", className: "border-hairbright bg-surface-soft text-ink-soft" },
} as const

const EFFECT_LABELS: Record<InterventionEffect, { label: string; className: string }> = {
  absorbed: { label: "Oferta absorbida", className: "text-warn" },
  partial: { label: "Efecto parcial", className: "text-warn" },
  effective: { label: "Oferta con efecto", className: "text-up" },
  inconclusive: { label: "Reacción aún no clara", className: "text-ink-soft" },
}

const PRESSURE_LABELS: Record<FxSupplyPressure, { label: string; className: string }> = {
  high: { label: "Alta", className: "text-warn" },
  moderate: { label: "Moderada", className: "text-ink-soft" },
  low: { label: "Baja", className: "text-up" },
}

/** Qué decir de un banco sin intervenciones, según su jornada. */
function absenceNote(status: FxSupplyStatus | null | undefined, stage: FxSupplyStage | null | undefined) {
  if (stage === "pre_window") return "su horario habitual aún no empieza"
  if (status === "MONITORING") return "aún en su horario habitual"
  if (status === "USUAL_WINDOW_MISSED") return "sin registro en su horario habitual"
  if (status === "EXPECTED_BUT_NOT_SEEN") return "sin registro en toda la jornada"
  if (status === "UNKNOWN") return "sin información confiable"
  return null
}

function signedPercent(value: number | null | undefined) {
  return value == null ? "—" : formatSignedPercent(value)
}

// ---------------------------------------------------------------------
// Piezas
// ---------------------------------------------------------------------

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-surface-raised motion-safe:animate-pulse-soft ${className}`}
      aria-hidden
    />
  )
}

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {icon}
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-raised px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold tabular-nums" style={{ color: tone ?? "#e9ebf0" }}>
        {value}
      </p>
    </div>
  )
}

function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="text-[12px] text-ink-muted">{label}</span>
      <span className="text-right text-[13px] font-semibold tabular-nums text-ink">{children}</span>
    </div>
  )
}

/**
 * Franja observada hoy. Es una lectura de lo que ya ocurrió, no una
 * recomendación de a qué hora operar.
 */
function BestHour({ label, bucket }: { label: string; bucket: HourBucket | null }) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-raised px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint">{label}</p>

      {bucket ? (
        <>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink-soft">
            {bucket.hour_start}–{bucket.hour_end}
          </p>
          <p className="mt-0.5 text-[11px] tabular-nums text-ink-faint">
            Bs {formatBs(bucket.median_price)} · {bucket.sample_count} lecturas
          </p>
        </>
      ) : (
        <p className="mt-0.5 text-sm font-semibold text-ink-faint">Sin datos suficientes</p>
      )}
    </div>
  )
}

function Cursor() {
  return (
    <span aria-hidden className="ml-0.5 inline-block motion-safe:animate-cursor-blink">
      ▋
    </span>
  )
}

/** Párrafos como nodos de texto: nada de markdown ni innerHTML. */
function Paragraphs({ parts, cursor }: { parts: string[]; cursor: boolean }) {
  return (
    <div>
      {parts.map((paragraph, index) => (
        <p key={index} className={`text-sm leading-relaxed text-ink-soft ${index === 0 ? "" : "mt-3"}`}>
          {paragraph}
          {cursor && index === parts.length - 1 && <Cursor />}
        </p>
      ))}
    </div>
  )
}

/**
 * Reparte el texto del modelo en titular, lectura rápida e
 * interpretación. El prompt pide: titular, línea en blanco y dos
 * párrafos. Mientras llega el stream el titular viene dentro del texto;
 * al terminar, el backend ya lo entrega separado.
 */
function splitNarrative(analysis: P2PMarketAnalysis | null, streamedText: string) {
  if (analysis) {
    const parts = (analysis.summary || "").split("\n\n").map((part) => part.trim()).filter(Boolean)

    return { headline: analysis.headline, reading: parts.slice(0, 1), interpretation: parts.slice(1) }
  }

  const parts = streamedText.split("\n\n").map((part) => part.trim()).filter(Boolean)

  return { headline: parts[0] ?? "", reading: parts.slice(1, 2), interpretation: parts.slice(2) }
}

/** "Oferta de divisas hoy": se entiende en cinco segundos. Solo datos reales. */
function SupplyToday({ reading }: { reading: MarketReading }) {
  const { bank_supply_today: supply, interventions_today: events } = reading.observations
  const derived = reading.derived_signals
  const last = events && events.length > 0 ? events[events.length - 1] : null
  const effect = derived.bank_intervention_effect ? EFFECT_LABELS[derived.bank_intervention_effect] : null
  const pressure = derived.fx_supply_pressure ? PRESSURE_LABELS[derived.fx_supply_pressure] : null

  return (
    <div className="divide-y divide-hair rounded-tile border border-hair bg-surface-raised px-3.5">
      {Object.entries(supply.by_institution).map(([key, entry]) => {
        const note = entry.count === 0 ? absenceNote(entry.status, entry.stage) : null

        return (
          <FactRow key={key} label={entry.label}>
            {entry.count} {entry.count === 1 ? "intervención" : "intervenciones"}
            {note && <span className="block text-[11px] font-normal text-ink-faint">{note}</span>}
          </FactRow>
        )
      })}

      {last && (
        <>
          <FactRow label="Última oferta">
            {last.time}
            <span className="ml-1 font-normal text-ink-faint">· {last.label}</span>
          </FactRow>

          {last.change_since_event != null && (
            <FactRow label="USDT/VES desde entonces">
              <span className={TONE_TEXT[toneOf(last.change_since_event)]}>
                {signedPercent(last.change_since_event)}
              </span>
            </FactRow>
          )}
        </>
      )}

      {effect && supply.total_interventions > 0 && (
        <FactRow label="Estado">
          <span className={effect.className}>{effect.label}</span>
        </FactRow>
      )}

      {pressure && (
        <FactRow label="Presión de oferta (inferida)">
          <span className={pressure.className}>{pressure.label}</span>
        </FactRow>
      )}
    </div>
  )
}

/** Respaldo si el backend todavía no manda la lectura nueva. */
function SupplyFallback({ fxSupply }: { fxSupply: FxSupplyContext }) {
  return (
    <div className="divide-y divide-hair rounded-tile border border-hair bg-surface-raised px-3.5">
      {Object.values(fxSupply).map((state) => (
        <FactRow key={state.institution} label={state.label}>
          {state.first_event_time
            ? `Registrada ${state.first_event_time}`
            : state.monitoring_closed
              ? "Sin registrar hoy"
              : `Monitoreando hasta ${state.monitor_until}`}
        </FactRow>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------

/**
 * Drawer de "Análisis del mercado" P2P.
 *
 * Orden: resumen (precio, 24h y estado del bolívar) → lectura rápida →
 * oferta de divisas hoy → interpretación → métricas → horas del día.
 * Los datos numéricos y la oferta salen de Django; solo la lectura y la
 * interpretación son texto del modelo.
 *
 * El análisis no se dispara al abrir: solo al pulsar el botón. La
 * narrativa llega por streaming a la velocidad real del modelo.
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
  reading,
  generatedAt,
  cached,
  onClose,
  onAnalyze,
  onOpenHistory,
}: Props) {
  const narrative = splitNarrative(analysis, streamedText)
  const hasContent = Boolean(narrative.headline || narrative.reading.length)
  const hasMetrics = Boolean(snapshot)

  // Dónde va el cursor mientras escribe el modelo.
  const writingInterpretation = streaming && narrative.interpretation.length > 0
  const writingReading = streaming && !writingInterpretation && narrative.reading.length > 0
  const writingHeadline = streaming && !writingInterpretation && !writingReading

  const showSkeleton = loading && !hasMetrics
  const bolivar = reading?.derived_signals.ves_direction
    ? BOLIVAR_STATUS[reading.derived_signals.ves_direction]
    : null

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      ariaLabel="Análisis del mercado"
      icon={<SparkleIcon className="h-4 w-4 shrink-0 text-brand-light" />}
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
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-brand-light outline-none transition hover:text-brand-light focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.97]"
            >
              <HistoryIcon className="h-4 w-4" />
              Ver historial
            </button>

            <button
              type="button"
              onClick={() => onAnalyze(true)}
              disabled={loading}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-surface-raised px-3.5 text-xs font-semibold text-ink-soft outline-none transition hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.97] disabled:opacity-40"
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
          <p className="text-sm text-ink-soft">Analizando mercado…</p>
          <Skeleton className="h-16 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[92%]" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-28 w-full" />
        </div>
      ) : error && !hasContent && !hasMetrics ? (
        <div className="flex flex-col items-start gap-3 rounded-tile bg-surface-raised p-4">
          <AlertIcon className="h-5 w-5 text-warn" />
          <p className="text-sm text-ink-soft">{error}</p>
          <p className="text-xs text-ink-faint">El mercado P2P sigue funcionando con normalidad.</p>
        </div>
      ) : hasMetrics && snapshot ? (
        <div className="motion-safe:animate-fade-in-fast">
          {/* ---------- B. Resumen ---------- */}
          <div className="rounded-tile border border-hair bg-surface-raised px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">USDT/VES</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <p className="text-[26px] font-extrabold leading-none tracking-tight tabular-nums text-ink">
                <span className="mr-1 text-[0.5em] font-bold text-ink-muted">Bs</span>
                {formatBs(snapshot.current_price)}
              </p>
              <TrendBadge value={snapshot.change_24h} suffix="24h" size="sm" />
            </div>
            {bolivar && (
              <span
                className={`mt-2.5 inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold ${bolivar.className}`}
              >
                {bolivar.label}
              </span>
            )}
          </div>

          {/* ---------- C. Lectura rápida ---------- */}
          <Section title="Lectura rápida">
            {narrative.headline ? (
              <p className="text-base font-bold leading-snug text-ink">
                {narrative.headline}
                {writingHeadline && <Cursor />}
              </p>
            ) : streaming || loading ? (
              <p className="text-sm text-ink-muted">Analizando mercado…</p>
            ) : (
              <p className="text-sm text-ink-muted">Pulsa "Actualizar análisis" para generar la lectura.</p>
            )}

            {narrative.reading.length > 0 && (
              <div className="mt-1.5">
                <Paragraphs parts={narrative.reading} cursor={writingReading} />
              </div>
            )}
          </Section>

          {/* ---------- D. Oferta de divisas hoy ---------- */}
          {reading ? (
            <Section title="Oferta de divisas hoy" icon={<VcIcon name="alert-bank" className="h-3.5 w-3.5" />}>
              <SupplyToday reading={reading} />
            </Section>
          ) : (
            fxSupply &&
            Object.keys(fxSupply).length > 0 && (
              <Section title="Oferta de divisas hoy" icon={<VcIcon name="alert-bank" className="h-3.5 w-3.5" />}>
                <SupplyFallback fxSupply={fxSupply} />
              </Section>
            )
          )}

          {/* ---------- E. Interpretación ---------- */}
          {narrative.interpretation.length > 0 && (
            <Section title="Interpretación" icon={<VcIcon name="market-analysis" className="h-3.5 w-3.5" />}>
              <Paragraphs parts={narrative.interpretation} cursor={writingInterpretation} />
            </Section>
          )}

          {/* ---------- F. Métricas ---------- */}
          <Section title="Métricas">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <Metric label="Tendencia" value={TREND_LABELS[snapshot.trend]} tone={trendColor(snapshot.trend)} />
              <Metric label="Momentum 1H" value={signedPercent(snapshot.change_1h)} />
              <Metric label="Volatilidad" value={VOLATILITY_LABELS[snapshot.volatility]} />
              <Metric
                label="Percentil 7D"
                value={snapshot.percentile_7d != null ? `${snapshot.percentile_7d}%` : "—"}
              />
              <Metric label="Prima BCV" value={signedPercent(snapshot.spread_percent)} />
              <Metric label="Spread" value={signedPercent(snapshot.spread_percent_market)} />
            </div>

            {analysis && (
              <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-surface-raised px-3 py-2">
                <span className="text-[11px] text-ink-muted">Nivel de riesgo</span>
                <span className="text-[11px] font-semibold" style={{ color: riskColor(analysis.risk_level) }}>
                  {RISK_LABELS[analysis.risk_level]}
                </span>
              </div>
            )}
          </Section>

          {/* ---------- G. Horas del día ---------- */}
          {intraday && (intraday.best_buy_hour || intraday.best_sell_hour) && (
            <Section title="Horas observadas hoy" icon={<ClockIcon className="h-3 w-3" />}>
              <div className="grid grid-cols-2 gap-2.5">
                <BestHour label="Precio más bajo (compra)" bucket={intraday.best_buy_hour} />
                <BestHour label="Precio más alto (venta)" bucket={intraday.best_sell_hour} />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
                Observación estadística de la jornada, no una garantía de lo que pasará después.
              </p>
            </Section>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-down/[0.08] px-3 py-2.5 text-xs leading-relaxed text-down">
              {hasContent ? "El análisis se interrumpió. Intenta nuevamente." : error}
            </p>
          )}

          <p className="mt-5 text-[11px] tabular-nums text-ink-faint">
            Precio de referencia: Bs {formatBs(snapshot.current_price)}
            {generatedAt ? ` · ${formatRelativeFromNow(generatedAt)}` : ""}
            {cached ? " · análisis guardado" : ""}
          </p>

          <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
            Análisis generado automáticamente a partir de los datos del mercado. La oferta de divisas y su
            efecto son lecturas de lo observado, no una medición de los dólares disponibles. No es asesoría
            financiera ni una predicción; la decisión es tuya.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4 py-2">
          <p className="text-sm leading-relaxed text-ink-soft">
            Genera un análisis del estado actual del mercado USDT/VES P2P a partir de los indicadores
            calculados por VeneCambio.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onAnalyze(false)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand/15 px-4 text-sm font-semibold text-brand-light outline-none transition duration-200 hover:bg-brand/25 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.97]"
            >
              <SparkleIcon className="h-4 w-4" />
              Analizar mercado
            </button>

            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-ink-muted outline-none transition hover:text-brand-light focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.97]"
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
