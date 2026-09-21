import { useCallback, useEffect, useState } from "react"

import type {
  AiAnalysisDetailResponse,
  AiAnalysisListItem,
} from "../../types/prices"
import {
  MarketAnalysisError,
  getAiAnalysisDetail,
  getAiAnalysisHistory,
} from "../../services/pricesApi"
import { formatBs } from "../../utils/format"
import ResponsiveSheet from "../shared/ResponsiveSheet"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HistoryIcon,
} from "../priceHistory/icons"
import { TREND_LABELS, trendColor } from "./theme"

type Props = {
  open: boolean
  onClose: () => void
}

const PAGE_SIZE = 20

const TRIGGER_LABELS: Record<string, string> = {
  manual: "Manual",
  checkpoint: "Automático",
  fx_event: "Oferta de divisas",
  fx_event_followup: "Seguimiento",
  daily_summary: "Resumen diario",
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Caracas",
  })
}

function dayOf(iso: string) {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Caracas",
  })
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-white/[0.06] motion-safe:animate-pulse-soft ${className}`}
      aria-hidden
    />
  )
}

/**
 * Línea de tiempo de los análisis del mismo día.
 *
 * Deliberadamente mínima: unos puntos y sus horas. La intención es ver
 * de un vistazo cuántas veces se miró el mercado y cuándo, no construir
 * una visualización.
 */
function DayTimeline({ items }: { items: AiAnalysisListItem[] }) {
  if (items.length < 2) return null

  return (
    <div className="mb-3 flex items-center gap-1 overflow-x-auto pb-1">
      {items.map((item, index) => (
        <div key={item.id} className="flex shrink-0 items-center gap-1">
          {index > 0 && <span className="h-px w-5 bg-white/[0.12]" aria-hidden />}
          <span className="flex flex-col items-center gap-1">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: trendColor(item.market_state) }}
            />
            <span className="text-[10px] tabular-nums text-[#4d5665]">
              {timeOf(item.generated_at)}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Historial de análisis IA.
 *
 * Abrir un elemento muestra el texto ya guardado: NUNCA vuelve a
 * ejecutar el modelo. Revisar lo que ya se escribió no puede costar una
 * inferencia.
 */
export default function AiHistorySheet({ open, onClose }: Props) {
  const [items, setItems] = useState<AiAnalysisListItem[]>([])
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<AiAnalysisDetailResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const controller = new AbortController()

    setLoading(true)
    setError(null)

    getAiAnalysisHistory({
      page,
      pageSize: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return

        setItems(result.results)
        setHasNext(result.has_next)
      })
      .catch((err) => {
        if (controller.signal.aborted) return

        setError(
          err instanceof MarketAnalysisError
            ? err.message
            : "No se pudo cargar el historial.",
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [open, page])

  // Al cerrar se vuelve a la lista, para no reabrir el panel dentro de
  // un análisis que ya se leyó.
  useEffect(() => {
    if (!open) {
      setSelected(null)
      setPage(1)
    }
  }, [open])

  const openDetail = useCallback(async (id: number) => {
    setDetailLoading(true)

    try {
      const detail = await getAiAnalysisDetail(id)
      setSelected(detail)
    } catch {
      setError("No se pudo abrir ese análisis.")
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const todayKey = items[0] ? dayOf(items[0].generated_at) : null
  const sameDay = items.filter(
    (item) => todayKey && dayOf(item.generated_at) === todayKey,
  )

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      ariaLabel="Historial de análisis"
      icon={<HistoryIcon className="h-4 w-4 shrink-0 text-[#a78bfa]" />}
      title={selected ? "Análisis guardado" : "Historial IA"}
      subtitle={
        selected
          ? `${dayOf(selected.generated_at)} · ${timeOf(selected.generated_at)}`
          : "Análisis generados por VeneCambio"
      }
      footer={
        selected ? (
          <>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white/[0.06] px-3.5 text-xs font-semibold text-[#d7dbe3] outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-white/30 active:scale-[0.97]"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Volver al historial
            </button>
            <span />
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page === 1 || loading}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white/[0.06] px-3.5 text-xs font-semibold text-[#d7dbe3] outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-white/30 active:scale-[0.97] disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Anterior
            </button>

            <button
              type="button"
              onClick={() => setPage((value) => value + 1)}
              disabled={!hasNext || loading}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white/[0.06] px-3.5 text-xs font-semibold text-[#d7dbe3] outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-white/30 active:scale-[0.97] disabled:opacity-40"
            >
              Siguiente
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </>
        )
      }
    >
      {selected ? (
        <div className="motion-safe:animate-fade-in-fast">
          <h3 className="text-base font-bold leading-snug text-[#e9ebf0]">
            {selected.analysis.headline}
          </h3>

          {selected.analysis.summary
            .split("\n\n")
            .filter(Boolean)
            .map((paragraph, index) => (
              <p
                key={index}
                className="mt-3 text-sm leading-relaxed text-[#a8b0be]"
              >
                {paragraph}
              </p>
            ))}

          {selected.snapshot && (
            <p className="mt-4 text-[11px] tabular-nums text-[#4d5665]">
              Precio de referencia: Bs {formatBs(selected.snapshot.current_price)}
            </p>
          )}

          <p className="mt-3 text-[11px] leading-relaxed text-[#4d5665]">
            Análisis guardado. No se volvió a generar al abrirlo.
          </p>
        </div>
      ) : loading || detailLoading ? (
        <div className="space-y-3" role="status" aria-label="Cargando historial">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-[#c9cfda]">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm leading-relaxed text-[#a8b0be]">
          Todavía no hay análisis guardados. El primero aparecerá aquí en
          cuanto generes uno.
        </p>
      ) : (
        <div className="motion-safe:animate-fade-in-fast">
          <DayTimeline items={sameDay} />

          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openDetail(item.id)}
                  className="w-full rounded-xl bg-white/[0.03] px-3 py-2.5 text-left outline-none transition hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50 active:scale-[0.995]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] tabular-nums text-[#646d7d]">
                      {dayOf(item.generated_at)} · {timeOf(item.generated_at)}
                    </span>

                    <span
                      className="shrink-0 text-[11px] font-semibold"
                      style={{ color: trendColor(item.market_state) }}
                    >
                      {TREND_LABELS[item.market_state]}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#d7dbe3]">
                    {item.headline}
                  </p>

                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="text-[11px] tabular-nums text-[#4d5665]">
                      {item.current_price != null
                        ? `Bs ${formatBs(item.current_price)}`
                        : "—"}
                    </span>

                    <span className="text-[11px] text-[#4d5665]">
                      {item.side} · {item.range} ·{" "}
                      {TRIGGER_LABELS[item.trigger] ?? item.trigger}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ResponsiveSheet>
  )
}
