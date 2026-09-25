import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ChartCandlestick, ChartLine } from "lucide-react"

import {
  MarketAnalysisError,
  getMarketAnalysis,
  getMarketAnalysisStatus,
  getPriceHistoryChart,
  peekPriceChart,
} from "../services/pricesApi"
import { onAppResume } from "../services/appLifecycle"
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
  RANGE_OPTIONS,
  getRangeOption,
  getSourceOption,
} from "../components/priceHistory/theme"
import AppShell from "../components/shell/AppShell"
import AppHeader from "../components/shell/AppHeader"
import PeriodEvents from "../components/priceHistory/PeriodEvents"
import PeriodAnalysisCard from "../components/priceHistory/PeriodAnalysisCard"
import { COLORS, priceChangeColor } from "../components/priceHistory/theme"
import { ChartCard, ChartToolbar } from "../components/ui/ChartCard"
import FullscreenChart from "../components/ui/FullscreenChart"
import { MetricCell, MetricGrid, Notice } from "../components/ui/primitives"
import { formatBs } from "../utils/format"
import { getStoredPriceHistorySource, setStoredPriceHistorySource } from "../utils/priceHistoryPreferences"
import { useCrossfade } from "../motion/useCrossfade"

const CHART_MODE_OPTIONS: { key: ChartMode; label: string }[] = [
  { key: "line", label: "Línea" },
  { key: "candles", label: "Velas" },
]

function bs(value: number | null) {
  return value === null ? "—" : formatBs(value)
}

/**
 * Alto del gráfico en teléfono, en CSS puro: sigue al viewport real
 * (orientación, barras del sistema, WebView de Capacitor) sin leer
 * window.innerHeight. Deja asomar las métricas cerca del pliegue.
 */
const MOBILE_CHART_HEIGHT = "clamp(240px, 33dvh, 300px)"

/**
 * Altura del gráfico según el ancho disponible. En escritorio crece para
 * seguir siendo el protagonista sin estirarse hasta ser incómodo.
 */
function useChartHeight() {
  const [height, setHeight] = useState<number | string>(MOBILE_CHART_HEIGHT)

  useEffect(() => {
    const tablet = window.matchMedia("(min-width: 640px)")
    const desktop = window.matchMedia("(min-width: 1024px)")

    function update() {
      setHeight(desktop.matches ? 420 : tablet.matches ? 360 : MOBILE_CHART_HEIGHT)
    }

    update()
    tablet.addEventListener("change", update)
    desktop.addEventListener("change", update)

    return () => {
      tablet.removeEventListener("change", update)
      desktop.removeEventListener("change", update)
    }
  }, [])

  return height
}

export default function PriceChartPage() {
  const [range, setRange] = useState<PriceChartRange>("24h")
  // ?series=bcv|usdt|average: así una notificación de alerta BCV o
  // Promedio abre el historial directamente en esa serie. Si no llega por
  // URL, se recuerda la última fuente elegida (localStorage); si nunca se
  // eligió ninguna, BCV es el punto de partida.
  const [searchParams] = useSearchParams()
  const [source, setSource] = useState<PriceSource>(() => {
    const series = searchParams.get("series")

    if (series === "bcv" || series === "usdt" || series === "average" || series === "eur") return series

    return getStoredPriceHistorySource() ?? "bcv"
  })

  function changeSource(next: PriceSource) {
    setSource(next)
    setStoredPriceHistorySource(next)
  }
  const [mode, setMode] = useState<ChartMode>("line")
  const [expanded, setExpanded] = useState(false)

  // Lo último conocido de esta gráfica se pinta al instante.
  const [chart, setChart] = useState<PriceHistoryChartResponse | null>(() => peekPriceChart("24h", source))
  const [resumeTick, setResumeTick] = useState(0)

  useEffect(() => onAppResume(() => setResumeTick((tick) => tick + 1)), [])
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

  const heroRef = useRef<HTMLDivElement | null>(null)
  const chartAreaRef = useRef<HTMLDivElement | null>(null)

  // Otro período u otra fuente: el precio entra de nuevo y el gráfico
  // hace una transición breve. No se anima ningún punto.
  useCrossfade(heroRef, `${range}-${source}`, { fromOpacity: 0, y: 6 })
  useCrossfade(chartAreaRef, `${range}-${source}-${mode}`)

  const closeExpanded = useCallback(() => setExpanded(false), [])

  // ---------------------------------------------------------
  // Carga del histórico
  // ---------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setError("")
        setLoading(true)

        // Cambiar de rango o fuente muestra al instante lo guardado.
        const cached = peekPriceChart(range, source)
        if (cached) setChart(cached)

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
    // resumeTick: al volver a la app o recuperar la red se revalida.
  }, [range, source, resumeTick])

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

  const changePercent = summary?.change_percent ?? null
  const changeTone = changePercent == null ? "neutral" : changePercent > 0 ? "up" : changePercent < 0 ? "down" : "neutral"

  // El color cuenta cómo se movió el período: verde si el precio subió,
  // rojo si bajó (convención del mercado). Sin variación, neutro.
  const chartSource = useMemo(
    () => ({
      ...sourceOption,
      color: priceChangeColor(changePercent, COLORS.textSoft),
    }),
    [sourceOption, changePercent],
  )

  function renderChart(height: number | string) {
    if (loading && !hasPoints) return <ChartSkeleton height={height} />

    if (error && !hasPoints) {
      return <EmptyState icon="alert" title="La gráfica no está disponible" description={error} height={height} />
    }

    if (!hasPoints) {
      return (
        <EmptyState
          title="Aún no hay datos suficientes"
          description={
            range === "24h"
              ? "Todavía no se registraron actualizaciones de precio en las últimas 24 horas."
              : "No hay cierres diarios guardados para este rango."
          }
          height={height}
        />
      )
    }

    if (mode === "candles" && !candlesAvailable) {
      return (
        <EmptyState
          title="Sin datos suficientes para velas"
          description={candles?.unavailable_reason ?? "Hacen falta más muestras en este período para construir velas."}
          height={height}
        />
      )
    }

    return (
      <PriceChart
        points={points}
        candles={candles?.data ?? []}
        mode={mode}
        source={chartSource}
        sourceKey={source}
        range={range}
        interval={candles?.interval ?? "hour"}
        height={height}
        resetSignal={resetSignal}
      />
    )
  }

  return (
    <>
      <AppShell ambient width="wide">
        <AppHeader variant="tab" title="Historial de precios" />

        {/* En escritorio, gráfico a la izquierda y una barra lateral a la
            derecha con período/métricas/análisis (como Analizador USDT en
            su vista Pro). La fuente (chips) va SIEMPRE encima del gráfico,
            en la columna principal, en los dos anchos — no se duplica. En
            móvil el resto sigue en una sola columna, en el mismo orden ya
            aprobado; por eso los bloques que en escritorio van a la barra
            lateral se duplican (una copia `lg:hidden` en su lugar móvil,
            otra `hidden lg:block` en la barra), ambas leen el mismo estado
            y solo una es visible a la vez. El gráfico y los eventos
            tampoco se duplican: van en el mismo lugar relativo en los dos
            anchos. */}
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-4">
          <div className="min-w-0 space-y-3">
            <div data-enter>
              <SourceChips value={source} onChange={changeSource} />
            </div>

            {usingCache && (
              <div data-enter>
                <Notice tone="warn">Sin conexión: se muestran los últimos datos guardados en este dispositivo.</Notice>
              </div>
            )}

            {/* ================= PRECIO + GRÁFICO (una sola card) ================= */}
            <div data-enter>
              <ChartCard>
                <div ref={heroRef} className="px-1 pt-1">
                  {loading && !summary ? (
                    <PriceHeroSkeleton />
                  ) : error && !summary ? (
                    <p className="text-[13px] text-down">No se pudieron cargar los precios.</p>
                  ) : summary ? (
                    <PriceHero summary={summary} source={sourceOption} range={range} />
                  ) : (
                    <p className="text-[13px] text-ink-muted">Todavía no hay precios registrados para {rangeLabel}.</p>
                  )}
                </div>

                <ChartToolbar
                  className="mt-2"
                  onReset={() => setResetSignal((value) => value + 1)}
                  onExpand={hasPoints ? () => setExpanded(true) : undefined}
                >
                  <div className="w-[152px]">
                    <SegmentedControl options={CHART_MODE_OPTIONS} value={mode} onChange={setMode} label="Tipo de gráfico" size="xs" />
                  </div>
                </ChartToolbar>

                <div ref={chartAreaRef} className="mt-1">
                  {renderChart(chartHeight)}
                </div>

                {mode === "candles" && candlesAvailable && candles?.low_detail && (
                  <p className="mt-2 px-1 text-[11px] leading-relaxed text-ink-faint">
                    Cada vela contiene una sola muestra, así que el recorrido interno del intervalo no se puede representar.
                  </p>
                )}

                <p className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-ink-faint">
                  {mode === "line" ? (
                    <ChartLine className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <ChartCandlestick className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {mode === "line"
                    ? `${sourceOption.label} · ${rangeLabel}`
                    : `${sourceOption.label} · velas por ${candles?.interval === "day" ? "día" : "hora"}`}
                </p>
              </ChartCard>
            </div>

            <div data-enter className="lg:hidden space-y-3">
              {/* ================= PERÍODO ================= */}
              <SegmentedControl
                options={RANGE_OPTIONS.map(({ key, label }) => ({ key, label }))}
                value={range}
                onChange={setRange}
                label="Período"
                size="sm"
              />

              {/* ================= MÉTRICAS 3×2 ================= */}
              {summary && (
                <MetricGrid columns={3} className="text-center">
                  <MetricCell compact label="Apertura" value={bs(summary.open)} />
                  <MetricCell compact label="Máximo" value={bs(summary.high)} tone="up" />
                  <MetricCell compact label="Mínimo" value={bs(summary.low)} tone="down" />
                  <MetricCell compact label="Cierre" value={bs(summary.close)} />
                  <MetricCell
                    compact
                    label="Variación"
                    value={summary.change == null ? "—" : `${summary.change > 0 ? "+" : summary.change < 0 ? "−" : ""}${formatBs(Math.abs(summary.change))}`}
                    tone={changeTone}
                  />
                  <MetricCell compact label="Promedio" value={bs(summary.average)} />
                </MetricGrid>
              )}
            </div>

            {/* ================= EVENTOS ================= */}
            {summary && (
              <div data-enter>
                <PeriodEvents summary={summary} points={points} source={source} range={range} />
              </div>
            )}

            {/* ================= ANÁLISIS DEL PERÍODO ================= */}
            <div data-enter className="lg:hidden">
              {aiAvailable ? (
                <PeriodAnalysisCard
                  analysis={aiAnalysis}
                  fallback={`Qué ocurrió con ${sourceOption.label} en ${rangeLabel}.`}
                  onOpen={openAnalysis}
                />
              ) : (
                <Notice>Análisis IA no disponible temporalmente.</Notice>
              )}
            </div>
          </div>

          {/* ================= BARRA LATERAL (solo escritorio) ================= */}
          <div data-enter className="hidden space-y-3 lg:block">
            <SegmentedControl
              options={RANGE_OPTIONS.map(({ key, label }) => ({ key, label }))}
              value={range}
              onChange={setRange}
              label="Período"
              size="sm"
            />

            {summary && (
              <MetricGrid columns={3} className="text-center">
                <MetricCell compact label="Apertura" value={bs(summary.open)} />
                <MetricCell compact label="Máximo" value={bs(summary.high)} tone="up" />
                <MetricCell compact label="Mínimo" value={bs(summary.low)} tone="down" />
                <MetricCell compact label="Cierre" value={bs(summary.close)} />
                <MetricCell
                  compact
                  label="Variación"
                  value={summary.change == null ? "—" : `${summary.change > 0 ? "+" : summary.change < 0 ? "−" : ""}${formatBs(Math.abs(summary.change))}`}
                  tone={changeTone}
                />
                <MetricCell compact label="Promedio" value={bs(summary.average)} />
              </MetricGrid>
            )}

            {aiAvailable ? (
              <PeriodAnalysisCard
                analysis={aiAnalysis}
                fallback={`Qué ocurrió con ${sourceOption.label} en ${rangeLabel}.`}
                onOpen={openAnalysis}
              />
            ) : (
              <Notice>Análisis IA no disponible temporalmente.</Notice>
            )}
          </div>
        </div>
      </AppShell>

      <FullscreenChart open={expanded} onClose={closeExpanded} title={sourceOption.label} subtitle={rangeLabel}>
        {(height) => renderChart(height)}
      </FullscreenChart>

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
    </>
  )
}
