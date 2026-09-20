import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  MarketAnalysisError,
  getMarketAnalysisStatus,
  getP2PMarketAnalysis,
  getP2PMarketStatus,
  getP2PTimeframeCandles,
} from "../services/pricesApi"
import type {
  P2PHistoryChartResponse,
  P2PHistoryRange,
  P2PMarketAnalysis,
  P2PMarketSnapshot,
  P2PSupportedTimeframe,
  P2PTimeframeKey,
  P2PViewMode,
} from "../types/prices"

import ProHeader from "../components/p2pMarket/ProHeader"
import TimeframeToolbar from "../components/p2pMarket/TimeframeToolbar"
import IndicatorsMenu from "../components/p2pMarket/IndicatorsMenu"
import type { IndicatorKey } from "../components/p2pMarket/IndicatorsMenu"
import P2PProChart from "../components/p2pMarket/P2PProChart"
import type { P2PChartMode } from "../components/p2pMarket/P2PProChart"
import MarketStatusPanel from "../components/p2pMarket/MarketStatusPanel"
import RapidDropAlertCard from "../components/p2pMarket/RapidDropAlertCard"
import AiFloatingButton from "../components/p2pMarket/AiFloatingButton"
import P2PAiDrawer from "../components/p2pMarket/P2PAiDrawer"
import SegmentedControl from "../components/priceHistory/SegmentedControl"
import { ChartSkeleton, EmptyState } from "../components/priceHistory/states"
import { LineChartIcon, CandleChartIcon, ResetZoomIcon } from "../components/priceHistory/icons"

const CHART_MODE_OPTIONS: { key: P2PChartMode; label: string }[] = [
  { key: "candles", label: "Velas" },
  { key: "line", label: "Línea" },
]

// Cuánta ventana de datos crudos hay que pedir según el timeframe de
// vela elegido: lo suficiente para tener velas de sobra sin mandar
// más muestras de las necesarias.
const RANGE_FOR_TIMEFRAME: Record<P2PTimeframeKey, P2PHistoryRange> = {
  "5m": "24h",
  "15m": "24h",
  "30m": "7d",
  "1h": "7d",
  "4h": "30d",
  "1d": "90d",
  "1w": "all",
}

function pickDefaultTimeframe(timeframes: P2PSupportedTimeframe[]): P2PTimeframeKey {
  const byKey = new Map(timeframes.map((item) => [item.key, item]))

  if (byKey.get("1h")?.available) return "1h"

  const firstAvailable = timeframes.find((item) => item.available)

  return firstAvailable?.key ?? "1h"
}

function useProChartHeight() {
  const [height, setHeight] = useState(360)

  useEffect(() => {
    function update() {
      const width = window.innerWidth

      if (width >= 1024) {
        setHeight(460)
      } else if (width >= 640) {
        setHeight(380)
      } else {
        setHeight(Math.max(300, Math.min(400, Math.round(window.innerHeight * 0.46))))
      }
    }

    update()
    window.addEventListener("resize", update)

    return () => window.removeEventListener("resize", update)
  }, [])

  return height
}

type Props = {
  viewMode: P2PViewMode
  onViewModeChange: (mode: P2PViewMode) => void
  onBack: () => void
}

export default function UsdtAnalyzerPro({ viewMode, onViewModeChange, onBack }: Props) {
  const [timeframes, setTimeframes] = useState<P2PSupportedTimeframe[]>([])
  const [timeframe, setTimeframe] = useState<P2PTimeframeKey | null>(null)
  const [chart, setChart] = useState<P2PHistoryChartResponse | null>(null)
  const [chartLoading, setChartLoading] = useState(true)
  const [chartError, setChartError] = useState("")

  const [chartMode, setChartMode] = useState<P2PChartMode>("candles")
  const [activeIndicators, setActiveIndicators] = useState<IndicatorKey[]>([])
  const [resetSignal, setResetSignal] = useState(0)

  const [snapshot, setSnapshot] = useState<P2PMarketSnapshot | null>(null)
  const [snapshotLoading, setSnapshotLoading] = useState(true)
  const [snapshotError, setSnapshotError] = useState("")

  const [aiAvailable, setAiAvailable] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<P2PMarketAnalysis | null>(null)
  const [aiSnapshot, setAiSnapshot] = useState<P2PMarketSnapshot | null>(null)
  const [aiGeneratedAt, setAiGeneratedAt] = useState<string | null>(null)

  const aiRequestRef = useRef<AbortController | null>(null)
  const chartHeight = useProChartHeight()

  // ---------------------------------------------------------
  // Snapshot del mercado (indicadores + alertas)
  // ---------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setSnapshotError("")
        setSnapshotLoading(true)

        const result = await getP2PMarketStatus({ signal: controller.signal })

        if (controller.signal.aborted) return

        setSnapshot(result)
      } catch (err) {
        if (controller.signal.aborted) return

        setSnapshotError(
          err instanceof MarketAnalysisError
            ? err.message
            : "No se pudo calcular el estado del mercado.",
        )
      } finally {
        if (!controller.signal.aborted) setSnapshotLoading(false)
      }
    }

    load()

    return () => controller.abort()
  }, [])

  // ---------------------------------------------------------
  // Disponibilidad de IA (mismo indicador que el historial de precios:
  // depende de si Ollama y el modelo están arriba, no de esta feature).
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

    return () => controller.abort()
  }, [])

  // ---------------------------------------------------------
  // Velas + indicadores del timeframe activo
  // ---------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setChartError("")
        setChartLoading(true)

        // Primer render: todavía no sabemos qué timeframe pedir, así
        // que se consulta con uno de referencia solo para leer
        // `supported_timeframes` y elegir un valor por defecto real.
        const probeTimeframe = timeframe ?? "1h"
        const range = RANGE_FOR_TIMEFRAME[probeTimeframe]

        const result = await getP2PTimeframeCandles(range, probeTimeframe, {
          indicators: activeIndicators,
          signal: controller.signal,
        })

        if (controller.signal.aborted) return

        setTimeframes(result.supported_timeframes)

        if (!timeframe) {
          const resolved = pickDefaultTimeframe(result.supported_timeframes)

          if (resolved !== probeTimeframe) {
            // El timeframe de sondeo no era el ideal: se vuelve a
            // pedir ya con el correcto antes de pintar nada.
            setTimeframe(resolved)
            return
          }
        }

        setChart(result)
        setTimeframe(probeTimeframe)
      } catch (err) {
        if (controller.signal.aborted) return

        setChartError(
          err instanceof Error ? err.message : "No se pudo cargar el gráfico profesional.",
        )
      } finally {
        if (!controller.signal.aborted) setChartLoading(false)
      }
    }

    load()

    return () => controller.abort()
  }, [timeframe, activeIndicators])

  const toggleIndicator = useCallback((key: IndicatorKey) => {
    setActiveIndicators((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }, [])

  // ---------------------------------------------------------
  // Análisis IA (manual: nunca se dispara solo al abrir el panel)
  // ---------------------------------------------------------
  useEffect(() => {
    return () => {
      aiRequestRef.current?.abort()
    }
  }, [])

  const runAiAnalysis = useCallback(async (refresh: boolean) => {
    aiRequestRef.current?.abort()

    const controller = new AbortController()
    aiRequestRef.current = controller

    setAiLoading(true)
    setAiError(null)

    try {
      const result = await getP2PMarketAnalysis("1h", { refresh, signal: controller.signal })

      if (controller.signal.aborted) return

      setAiAnalysis(result.analysis)
      setAiSnapshot(result.snapshot)
      setAiGeneratedAt(new Date().toISOString())
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
  }, [])

  function openAiDrawer() {
    setAiOpen(true)
  }

  const activeTimeframeMeta = useMemo(
    () => timeframes.find((item) => item.key === timeframe) ?? null,
    [timeframes, timeframe],
  )

  const primaryAlert = snapshot?.alerts[0] ?? null

  return (
    <main className="min-h-dvh bg-[#0a0c11] text-[#e9ebf0]">
      <ProHeader
        snapshot={snapshot}
        loading={snapshotLoading}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onBack={onBack}
        onOpenAi={openAiDrawer}
        aiAvailable={aiAvailable}
      />

      <div
        className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-6 lg:grid lg:grid-cols-[1fr_300px] lg:gap-4"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="min-w-0">
          {snapshotError && !snapshotLoading && (
            <p className="mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-[11px] text-[#8b93a3]">
              {snapshotError}
            </p>
          )}

          {primaryAlert && snapshot && (
            <div className="mb-3">
              <RapidDropAlertCard
                alert={primaryAlert}
                snapshot={snapshot}
                onViewAnalysis={openAiDrawer}
              />
            </div>
          )}

          <section className="rounded-[16px] border border-white/[0.06] bg-[#12151c] p-3 sm:p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <TimeframeToolbar
                timeframes={timeframes}
                value={timeframe ?? "1h"}
                onChange={setTimeframe}
              />

              <div className="flex items-center gap-2">
                <IndicatorsMenu
                  active={new Set(activeIndicators)}
                  onToggle={toggleIndicator}
                />

                <div className="hidden w-[140px] sm:block">
                  <SegmentedControl
                    options={CHART_MODE_OPTIONS}
                    value={chartMode}
                    onChange={setChartMode}
                    label="Tipo de gráfico"
                    size="sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setResetSignal((value) => value + 1)}
                  aria-label="Restablecer zoom"
                  title="Restablecer zoom"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-[#8b93a3] outline-none transition duration-200 hover:border-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
                >
                  <ResetZoomIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Selector de modo compacto solo en móvil, debajo del toolbar de timeframes. */}
            <div className="mb-2 w-[140px] sm:hidden">
              <SegmentedControl
                options={CHART_MODE_OPTIONS}
                value={chartMode}
                onChange={setChartMode}
                label="Tipo de gráfico"
                size="sm"
              />
            </div>

            {chartLoading && !chart ? (
              <ChartSkeleton height={chartHeight} />
            ) : chartError && !chart ? (
              <EmptyState icon="alert" title="No se pudo cargar el gráfico" description={chartError} height={chartHeight} />
            ) : !chart || chart.data.length === 0 ? (
              <EmptyState
                title="Aún no hay velas en este rango"
                description="Prueba con otro timeframe o espera a que se acumulen más capturas."
                height={chartHeight}
              />
            ) : (
              <P2PProChart
                candles={chart.data}
                indicators={chart.indicators}
                activeIndicators={activeIndicators}
                intervalSeconds={activeTimeframeMeta?.interval_seconds ?? 3600}
                height={chartHeight}
                resetSignal={resetSignal}
                mode={chartMode}
              />
            )}
          </section>

          <p className="mt-3 flex items-center gap-1.5 px-1 text-[11px] text-[#3f4757]">
            {chartMode === "candles" ? (
              <CandleChartIcon className="h-3.5 w-3.5" />
            ) : (
              <LineChartIcon className="h-3.5 w-3.5" />
            )}
            USDT/VES · SELL · velas de {activeTimeframeMeta?.label ?? timeframe}
          </p>

          {/* Estado del mercado también aquí en móvil, debajo del chart. */}
          {snapshot && (
            <div className="mt-4 lg:hidden">
              <MarketStatusPanel snapshot={snapshot} />
            </div>
          )}
        </div>

        {/* Panel lateral solo en desktop. */}
        {snapshot && (
          <div className="mt-4 hidden lg:mt-0 lg:block">
            <MarketStatusPanel snapshot={snapshot} />
          </div>
        )}
      </div>

      {aiAvailable && <AiFloatingButton onClick={openAiDrawer} />}

      <P2PAiDrawer
        open={aiOpen}
        loading={aiLoading}
        error={aiError}
        analysis={aiAnalysis}
        snapshot={aiSnapshot}
        generatedAt={aiGeneratedAt}
        onClose={() => setAiOpen(false)}
        onAnalyze={runAiAnalysis}
      />
    </main>
  )
}
