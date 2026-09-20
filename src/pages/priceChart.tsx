import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  MarketAnalysisError,
  getMarketAnalysis,
  getMarketAnalysisStatus,
  getPriceHistoryChart,
} from "../services/pricesApi"
import type {
  MarketAnalysis,
  MarketAnalysisContext,
  PriceChartRange,
  PriceHistoryChartResponse,
  PriceSource,
} from "../types/prices"

import PriceChart from "../components/priceHistory/PriceChart"
import type { ChartMode } from "../components/priceHistory/PriceChart"
import PriceHero from "../components/priceHistory/PriceHero"
import SegmentedControl from "../components/priceHistory/SegmentedControl"
import SourceChips from "../components/priceHistory/SourceChips"
import AiAnalysisPanel from "../components/priceHistory/AiAnalysisPanel"
import {
  ChartSkeleton,
  EmptyState,
  PriceHeroSkeleton,
} from "../components/priceHistory/states"
import {
  CandleChartIcon,
  ChevronLeftIcon,
  LineChartIcon,
  ResetZoomIcon,
  SparkleIcon,
} from "../components/priceHistory/icons"
import {
  RANGE_OPTIONS,
  getRangeOption,
  getSourceOption,
} from "../components/priceHistory/theme"

const CHART_MODE_OPTIONS: { key: ChartMode; label: string }[] = [
  { key: "line", label: "Línea" },
  { key: "candles", label: "Velas" },
]

/**
 * Altura del gráfico según el ancho disponible.
 *
 * En teléfono el gráfico es el elemento con más peso de la pantalla;
 * en escritorio crece para que siga siendo el protagonista sin
 * estirarse hasta ser incómodo de leer.
 */
function useChartHeight() {
  const [height, setHeight] = useState(300)

  useEffect(() => {
    function update() {
      const width = window.innerWidth

      if (width >= 1024) {
        setHeight(420)
      } else if (width >= 640) {
        setHeight(360)
      } else {
        // Aproximadamente media pantalla, con un mínimo utilizable.
        setHeight(Math.max(280, Math.min(340, Math.round(window.innerHeight * 0.42))))
      }
    }

    update()
    window.addEventListener("resize", update)

    return () => {
      window.removeEventListener("resize", update)
    }
  }, [])

  return height
}

export default function PriceChartPage() {
  const navigate = useNavigate()

  const [range, setRange] = useState<PriceChartRange>("24h")
  const [source, setSource] = useState<PriceSource>("average")
  const [mode, setMode] = useState<ChartMode>("line")

  const [chart, setChart] = useState<PriceHistoryChartResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [usingCache, setUsingCache] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)

  // --- Análisis IA -----------------------------------------
  const [aiAvailable, setAiAvailable] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<MarketAnalysis | null>(null)
  const [aiContext, setAiContext] = useState<MarketAnalysisContext | null>(null)
  const [aiCached, setAiCached] = useState(false)

  const aiRequestRef = useRef<AbortController | null>(null)

  const chartHeight = useChartHeight()

  // ---------------------------------------------------------
  // Carga del histórico
  // ---------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setError("")
        setLoading(true)

        const result = await getPriceHistoryChart(range, source, {
          signal: controller.signal,
        })

        if (controller.signal.aborted) return

        setChart(result.data)
        setUsingCache(result.fromCache)
      } catch (err) {
        if (controller.signal.aborted) return

        setError(err instanceof Error ? err.message : "Error cargando la gráfica")
        setChart(null)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()

    return () => {
      controller.abort()
    }
  }, [range, source])

  // ---------------------------------------------------------
  // Disponibilidad de la IA
  //
  // Es una comprobación complementaria: si falla, la pantalla sigue
  // funcionando y el botón de análisis simplemente no se ofrece.
  // ---------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController()

    getMarketAnalysisStatus({ signal: controller.signal })
      .then((status) => {
        if (!controller.signal.aborted) setAiAvailable(status.available)
      })
      .catch(() => {
        if (!controller.signal.aborted) setAiAvailable(false)
      })

    return () => {
      controller.abort()
    }
  }, [])

  // Un análisis pertenece a un período concreto: al cambiar de rango o
  // de fuente el anterior deja de ser válido.
  useEffect(() => {
    setAiAnalysis(null)
    setAiContext(null)
    setAiError(null)
  }, [range, source])

  useEffect(() => {
    return () => {
      aiRequestRef.current?.abort()
    }
  }, [])

  const runAnalysis = useCallback(
    async (options: { refresh?: boolean } = {}) => {
      aiRequestRef.current?.abort()

      const controller = new AbortController()
      aiRequestRef.current = controller

      setAiLoading(true)
      setAiError(null)

      try {
        const result = await getMarketAnalysis(range, source, {
          refresh: options.refresh,
          signal: controller.signal,
        })

        if (controller.signal.aborted) return

        setAiAnalysis(result.analysis)
        setAiContext(result.context)
        setAiCached(result.cached)
      } catch (err) {
        if (controller.signal.aborted) return

        setAiAnalysis(null)

        setAiError(
          err instanceof MarketAnalysisError
            ? err.message
            : "Análisis IA no disponible temporalmente.",
        )
      } finally {
        if (!controller.signal.aborted) setAiLoading(false)
      }
    },
    [range, source],
  )

  function openAnalysis() {
    setAiOpen(true)

    if (!aiAnalysis && !aiLoading) {
      runAnalysis()
    }
  }

  // ---------------------------------------------------------
  // Datos derivados
  // ---------------------------------------------------------
  const sourceOption = useMemo(() => getSourceOption(source), [source])

  const points = chart?.data ?? []
  const summary = chart?.summary ?? null
  const candles = chart?.candles

  const hasPoints = points.length > 0
  const candlesAvailable = Boolean(candles?.available)

  const rangeLabel = getRangeOption(range).long

  return (
    <main className="min-h-dvh bg-[#0a0c11] text-[#e9ebf0]">
      {/* Halo muy tenue detrás de la cabecera: da profundidad sin
          convertirse en un degradado enorme. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-64 opacity-60"
        style={{
          background: `radial-gradient(60% 100% at 50% 0%, ${sourceOption.color}14 0%, transparent 70%)`,
        }}
      />

      <div
        className="relative mx-auto w-full max-w-[720px] px-4 pb-10 lg:max-w-[960px] lg:px-6"
        style={{
          paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
          paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* ================= HEADER ================= */}
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Volver"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-[#c9cfda] outline-none transition duration-200 hover:border-white/15 hover:bg-white/[0.07] hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
          >
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-bold leading-tight tracking-tight">
              Historial de precios
            </h1>
            <p className="truncate text-[11px] text-[#646d7d]">
              Fluctuación del dólar y USDT
            </p>
          </div>

          {aiAvailable && (
            <button
              type="button"
              onClick={openAnalysis}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#a78bfa]/25 bg-[#a78bfa]/[0.09] px-3 text-xs font-semibold text-[#c4b5fd] outline-none transition duration-200 hover:border-[#a78bfa]/45 hover:bg-[#a78bfa]/[0.16] focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50 active:scale-[0.97]"
            >
              <SparkleIcon className="h-3.5 w-3.5" />
              Analizar
            </button>
          )}
        </header>

        {/* ================= CONTROLES ================= */}
        <div className="mt-5">
          <SegmentedControl
            options={RANGE_OPTIONS.map(({ key, label }) => ({ key, label }))}
            value={range}
            onChange={setRange}
            label="Período"
          />
        </div>

        <div className="mt-3">
          <SourceChips value={source} onChange={setSource} />
        </div>

        {usingCache && (
          <p className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-[11px] text-[#8b93a3]">
            Sin conexión con el servidor: se muestran los últimos datos guardados
            en este dispositivo.
          </p>
        )}

        {/* ================= PRICE HERO ================= */}
        <section className="mt-5 rounded-[20px] border border-white/[0.06] bg-[#12151c] p-5">
          {loading && !summary ? (
            <PriceHeroSkeleton />
          ) : error && !summary ? (
            <EmptyState
              icon="alert"
              title="No se pudieron cargar los precios"
              description={error}
            />
          ) : summary ? (
            <PriceHero summary={summary} source={sourceOption} range={range} />
          ) : (
            <EmptyState
              title="Sin datos en este período"
              description={`Todavía no hay precios registrados para ${rangeLabel}.`}
            />
          )}
        </section>

        {/* ================= GRÁFICO ================= */}
        <section className="mt-4 rounded-[20px] border border-white/[0.06] bg-[#12151c] p-3 sm:p-4">
          {/* Controles del gráfico. */}
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="w-[168px]">
              <SegmentedControl
                options={CHART_MODE_OPTIONS}
                value={mode}
                onChange={setMode}
                label="Tipo de gráfico"
                size="sm"
              />
            </div>

            <button
              type="button"
              onClick={() => setResetSignal((value) => value + 1)}
              aria-label="Restablecer zoom"
              title="Restablecer zoom"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-[#8b93a3] outline-none transition duration-200 hover:border-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
            >
              <ResetZoomIcon />
            </button>
          </div>

          {loading && !hasPoints ? (
            <ChartSkeleton height={chartHeight} />
          ) : error && !hasPoints ? (
            <EmptyState
              icon="alert"
              title="La gráfica no está disponible"
              description={error}
              height={chartHeight}
            />
          ) : !hasPoints ? (
            <EmptyState
              title="Aún no hay datos suficientes"
              description={
                range === "24h"
                  ? "Todavía no se registraron actualizaciones de precio en las últimas 24 horas."
                  : "No hay cierres diarios guardados para este rango."
              }
              height={chartHeight}
            />
          ) : mode === "candles" && !candlesAvailable ? (
            <EmptyState
              title="Sin datos suficientes para velas"
              description={
                candles?.unavailable_reason ??
                "Hacen falta más muestras en este período para construir velas."
              }
              height={chartHeight}
            />
          ) : (
            <PriceChart
              points={points}
              candles={candles?.data ?? []}
              mode={mode}
              source={sourceOption}
              sourceKey={source}
              range={range}
              interval={candles?.interval ?? "hour"}
              height={chartHeight}
              resetSignal={resetSignal}
            />
          )}

          {mode === "candles" && candlesAvailable && candles?.low_detail && (
            <p className="mt-2 px-1 text-[11px] leading-relaxed text-[#4d5665]">
              Cada vela contiene una sola muestra, así que el recorrido interno
              del intervalo no se puede representar.
            </p>
          )}
        </section>

        {/* ================= ACCESO AL ANÁLISIS ================= */}
        <section className="mt-4">
          {aiAvailable ? (
            <button
              type="button"
              onClick={openAnalysis}
              className="flex w-full items-center gap-3 rounded-[20px] border border-white/[0.06] bg-[#12151c] px-4 py-4 text-left outline-none transition duration-200 hover:border-[#a78bfa]/30 hover:bg-[#151823] focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50 active:scale-[0.995]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#a78bfa]/[0.12] text-[#c4b5fd]">
                <SparkleIcon className="h-4 w-4" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#e9ebf0]">
                  Analizar período
                </span>
                <span className="block truncate text-[11px] text-[#646d7d]">
                  Qué ocurrió con {sourceOption.label} en {rangeLabel}
                </span>
              </span>

              <ChevronLeftIcon className="h-4 w-4 rotate-180 shrink-0 text-[#4d5665]" />
            </button>
          ) : (
            <p className="rounded-[20px] border border-white/[0.05] bg-white/[0.015] px-4 py-3.5 text-[11px] text-[#4d5665]">
              Análisis IA no disponible temporalmente.
            </p>
          )}
        </section>

        {/* Leyenda discreta del modo activo, útil en pantallas pequeñas. */}
        <p className="mt-4 flex items-center gap-1.5 px-1 text-[11px] text-[#3f4757]">
          {mode === "line" ? (
            <LineChartIcon className="h-3.5 w-3.5" />
          ) : (
            <CandleChartIcon className="h-3.5 w-3.5" />
          )}
          {mode === "line"
            ? `${sourceOption.label} · ${rangeLabel}`
            : `${sourceOption.label} · velas por ${
                candles?.interval === "day" ? "día" : "hora"
              }`}
        </p>
      </div>

      <AiAnalysisPanel
        open={aiOpen}
        loading={aiLoading}
        error={aiError}
        analysis={aiAnalysis}
        context={aiContext}
        cached={aiCached}
        onClose={() => setAiOpen(false)}
        onRefresh={() => runAnalysis({ refresh: true })}
      />
    </main>
  )
}
