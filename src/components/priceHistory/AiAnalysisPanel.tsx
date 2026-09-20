import { useEffect, useRef } from "react"

import type {
  MarketAnalysis,
  MarketAnalysisContext,
  MarketVolatility,
} from "../../types/prices"
import { formatBs } from "../../utils/format"
import { AlertIcon, CloseIcon, RefreshIcon, SparkleIcon } from "./icons"
import { COLORS } from "./theme"

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
      className={`rounded-md bg-white/[0.06] motion-safe:animate-pulse-soft ${className}`}
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
    <div className="min-w-0 rounded-xl bg-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#646d7d]">
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
 * Panel de análisis del mercado.
 *
 * En móvil es un bottom sheet; a partir de `sm` se convierte en un
 * panel lateral. Todo el contenido llega como texto plano ya saneado
 * por Django: no se interpreta markdown ni HTML recibido del modelo.
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
  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  // Cerrar con Escape y devolver el foco al panel al abrirlo.
  useEffect(() => {
    if (!open) return

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", handleKey)
    closeButtonRef.current?.focus()

    return () => {
      document.removeEventListener("keydown", handleKey)
    }
  }, [open, onClose])

  // Bloquear el scroll del fondo mientras el sheet está abierto.
  useEffect(() => {
    if (!open) return

    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  const summary = context?.summary ?? null

  const changePercent = summary?.change_percent ?? null

  const changeTone =
    changePercent === null
      ? COLORS.textMuted
      : changePercent > 0
        ? COLORS.up
        : changePercent < 0
          ? COLORS.down
          : COLORS.textMuted

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-end">
      <button
        type="button"
        aria-label="Cerrar análisis"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 motion-safe:animate-fade-in-fast backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Análisis del mercado"
        className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[20px] border border-white/[0.07] bg-[#12151c] shadow-[0_-16px_50px_rgba(0,0,0,0.5)] motion-safe:animate-sheet-up sm:h-full sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-[20px] sm:border-y-0 sm:border-r-0 sm:motion-safe:animate-panel-in"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Asa del bottom sheet, solo en móvil. */}
        <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden>
          <span className="h-1 w-9 rounded-full bg-white/15" />
        </div>

        <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-3 sm:pt-5">
          <div className="flex min-w-0 items-center gap-2">
            <SparkleIcon className="h-4 w-4 shrink-0 text-[#a78bfa]" />
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-[#e9ebf0]">
                Análisis del mercado
              </h2>
              {context && (
                <p className="truncate text-[11px] text-[#646d7d]">
                  {context.source_label} · generado con los datos del período
                </p>
              )}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#8b93a3] outline-none transition hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <LoadingBody />
          ) : error ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl bg-white/[0.03] p-4">
              <AlertIcon className="h-5 w-5 text-[#f0b429]" />
              <p className="text-sm text-[#c9cfda]">{error}</p>
              <p className="text-xs text-[#646d7d]">
                El historial de precios sigue funcionando con normalidad.
              </p>
            </div>
          ) : analysis ? (
            <div className="motion-safe:animate-fade-in-fast">
              <h3 className="text-base font-bold leading-snug text-[#e9ebf0]">
                {analysis.headline}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#a8b0be]">
                {analysis.summary}
              </p>

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
                <Metric
                  label="Volatilidad"
                  value={VOLATILITY_LABELS[analysis.volatility]}
                />
              </div>

              {analysis.highlights.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {analysis.highlights.map((highlight, index) => (
                    <li
                      key={index}
                      className="flex gap-2.5 text-xs leading-relaxed text-[#8b93a3]"
                    >
                      <span
                        aria-hidden
                        className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-[#a78bfa]"
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-5 text-[11px] leading-relaxed text-[#4d5665]">
                Análisis generado automáticamente a partir de los precios
                registrados en el período. No es asesoría financiera ni una
                predicción.
              </p>
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/[0.05] px-5 py-3">
          <span className="truncate text-[11px] text-[#4d5665]">
            {cached && !loading ? "Análisis guardado de este mismo período" : ""}
          </span>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white/[0.06] px-3.5 text-xs font-semibold text-[#d7dbe3] outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-white/30 active:scale-[0.97] disabled:opacity-40"
          >
            <RefreshIcon className={loading ? "h-4 w-4 motion-safe:animate-spin" : "h-4 w-4"} />
            Actualizar análisis
          </button>
        </footer>
      </div>
    </div>
  )
}
