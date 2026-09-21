import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  MarketAnalysisError,
  getMarketAnalysisStatus,
  getP2PMarketCurrent,
  getP2PMarketStatus,
  getP2PNotionalHistory,
  getP2PTimeframeCandles,
} from "../services/pricesApi"
import { streamP2PMarketAnalysis } from "../services/aiStream"
import type {
  FxSupplyContext,
  IntradayBestHours,
  P2PChartCandle,
  P2PHistoryRange,
  P2PIndicatorSeries,
  P2PMarketAnalysis,
  P2PMarketSnapshot,
  P2PMarketState,
  P2PMarketStatusResponse,
  P2PRiskLevel,
  P2PSideCandle,
  P2PSideCandlesPayload,
  P2PSideSelection,
  P2PSupportedTimeframe,
  P2PTimeframeKey,
  P2PViewMode,
} from "../types/prices"
import { getStoredP2PNotional, getStoredP2PSide, setStoredP2PNotional, setStoredP2PSide } from "../utils/p2pPreferences"

import ProHeader from "../components/p2pMarket/ProHeader"
import TimeframeToolbar from "../components/p2pMarket/TimeframeToolbar"
import IndicatorsMenu from "../components/p2pMarket/IndicatorsMenu"
import type { IndicatorKey } from "../components/p2pMarket/IndicatorsMenu"
import SideSelector from "../components/p2pMarket/SideSelector"
import NotionalSelector from "../components/p2pMarket/NotionalSelector"
import P2PProChart from "../components/p2pMarket/P2PProChart"
import type { P2PChartMode } from "../components/p2pMarket/P2PProChart"
import P2PDualLineChart from "../components/p2pMarket/P2PDualLineChart"
import MarketStatusPanel from "../components/p2pMarket/MarketStatusPanel"
import FxSupplyCard from "../components/p2pMarket/FxSupplyCard"
import RapidDropAlertCard from "../components/p2pMarket/RapidDropAlertCard"
import AiFloatingButton from "../components/p2pMarket/AiFloatingButton"
import P2PAiDrawer from "../components/p2pMarket/P2PAiDrawer"
import AiHistorySheet from "../components/p2pMarket/AiHistorySheet"
import SegmentedControl from "../components/priceHistory/SegmentedControl"
import { ChartSkeleton, EmptyState } from "../components/priceHistory/states"
import { LineChartIcon, CandleChartIcon, ResetZoomIcon } from "../components/priceHistory/icons"

// El notional "clásico" (P2PCapture SELL/BUY a este monto) es el único
// con historial profundo desde antes de esta feature. El resto de los
// notionals y el modo "Ambos" salen de P2PMarketSnapshot, que recién
// empezó a acumularse: por eso se muestran por separado, sin fingir
// que tienen la misma densidad histórica.
const REFERENCE_NOTIONAL = 500
const DEFAULT_NOTIONAL_LEVELS = [100, 250, 500, 1000]

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
  const [side, setSide] = useState<P2PSideSelection>(() => getStoredP2PSide())
  const [notional, setNotional] = useState<number>(() => getStoredP2PNotional(REFERENCE_NOTIONAL))
  const [notionalLevels, setNotionalLevels] = useState<number[]>(DEFAULT_NOTIONAL_LEVELS)

  const [timeframes, setTimeframes] = useState<P2PSupportedTimeframe[]>([])
  const [timeframe, setTimeframe] = useState<P2PTimeframeKey | null>(null)

  // Modo "un solo lado" (clásico o notional distinto de la referencia).
  const [chartCandles, setChartCandles] = useState<P2PChartCandle[]>([])
  const [chartIndicators, setChartIndicators] = useState<P2PIndicatorSeries>({})

  // Modo "Ambos": dos series independientes desde P2PMarketSnapshot.
  const [sellCandles, setSellCandles] = useState<P2PSideCandle[]>([])
  const [buyCandles, setBuyCandles] = useState<P2PSideCandle[]>([])

  const [chartAvailable, setChartAvailable] = useState(true)
  const [chartReason, setChartReason] = useState<string | null>(null)
  const [chartLoading, setChartLoading] = useState(true)
  const [chartError, setChartError] = useState("")

  const [chartMode, setChartMode] = useState<P2PChartMode>("candles")
  const [activeIndicators, setActiveIndicators] = useState<IndicatorKey[]>([])
  const [resetSignal, setResetSignal] = useState(0)

  // El estado del mercado llega con extras (intradía y oferta de
  // divisas) además del snapshot, de ahí el tipo de la respuesta.
  const [snapshot, setSnapshot] = useState<P2PMarketStatusResponse | null>(null)
  const [snapshotLoading, setSnapshotLoading] = useState(true)
  const [snapshotError, setSnapshotError] = useState("")

  const [aiAvailable, setAiAvailable] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiHistoryOpen, setAiHistoryOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiStreaming, setAiStreaming] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<P2PMarketAnalysis | null>(null)
  const [aiStreamedText, setAiStreamedText] = useState("")
  const [aiSnapshot, setAiSnapshot] = useState<P2PMarketSnapshot | null>(null)
  const [aiIntraday, setAiIntraday] = useState<IntradayBestHours | null>(null)
  const [aiFxSupply, setAiFxSupply] = useState<FxSupplyContext | null>(null)
  const [aiGeneratedAt, setAiGeneratedAt] = useState<string | null>(null)
  const [aiCached, setAiCached] = useState(false)

  const aiRequestRef = useRef<AbortController | null>(null)
  const aiClassificationRef = useRef<{
    market_state: P2PMarketState
    risk_level: P2PRiskLevel
  }>({ market_state: "neutral", risk_level: "normal" })
  const chartHeight = useProChartHeight()

  const isDual = side === "BOTH"
  const usingClassicSeries = !isDual && notional === REFERENCE_NOTIONAL

  function handleSideChange(next: P2PSideSelection) {
    setSide(next)
    setStoredP2PSide(next)
  }

  function handleNotionalChange(next: number) {
    setNotional(next)
    setStoredP2PNotional(next)
  }

  // ---------------------------------------------------------
  // Niveles de notional realmente configurados en el backend.
  // ---------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController()

    getP2PMarketCurrent({ signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return

        const levels = Object.keys(result.sell).map(Number).sort((a, b) => a - b)

        if (levels.length) setNotionalLevels(levels)
      })
      .catch(() => {
        // Sin snapshot todavía: se mantienen los niveles por defecto.
      })

    return () => controller.abort()
  }, [])

  // ---------------------------------------------------------
  // Snapshot del mercado (indicadores + alertas) del lado protagonista.
  // ---------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController()
    const snapshotSide = side === "BOTH" ? "SELL" : side

    async function load() {
      try {
        setSnapshotError("")
        setSnapshotLoading(true)

        const result = await getP2PMarketStatus({ side: snapshotSide, signal: controller.signal })

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
  }, [side])

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
  // Timeframes soportados: se sondean siempre contra la serie clásica
  // (SELL, notional de referencia), que es la más densa y estable. Es
  // una aproximación razonable para las otras combinaciones: la
  // respuesta de cada combinación igual trae su propio `available`
  // por si esa serie en particular todavía no tiene datos.
  // ---------------------------------------------------------
  useEffect(() => {
    if (timeframe) return

    const controller = new AbortController()

    getP2PTimeframeCandles("7d", "1h", { side: "SELL", signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return

        setTimeframes(result.supported_timeframes)
        setTimeframe(pickDefaultTimeframe(result.supported_timeframes))
      })
      .catch(() => {
        if (!controller.signal.aborted) setTimeframe("1h")
      })

    return () => controller.abort()
  }, [timeframe])

  // ---------------------------------------------------------
  // Datos del chart: clásico (rico en historia) o multi-notional
  // (nuevo, crece a partir de ahora).
  // ---------------------------------------------------------
  useEffect(() => {
    if (!timeframe) return

    const controller = new AbortController()

    async function load() {
      try {
        setChartError("")
        setChartLoading(true)

        const range = RANGE_FOR_TIMEFRAME[timeframe as P2PTimeframeKey]

        if (isDual) {
          const result = await getP2PNotionalHistory("BOTH", notional, range, timeframe as P2PTimeframeKey, {
            signal: controller.signal,
          })

          if (controller.signal.aborted) return

          const data = result.data as { sell: P2PSideCandlesPayload; buy: P2PSideCandlesPayload }

          setSellCandles(data.sell.data)
          setBuyCandles(data.buy.data)
          setChartAvailable(data.sell.available || data.buy.available)
          setChartReason(data.sell.reason ?? data.buy.reason)
        } else if (usingClassicSeries) {
          const result = await getP2PTimeframeCandles(range, timeframe as P2PTimeframeKey, {
            indicators: activeIndicators,
            side: side as "SELL" | "BUY",
            signal: controller.signal,
          })

          if (controller.signal.aborted) return

          setChartCandles(result.data)
          setChartIndicators(result.indicators)
          setChartAvailable(result.timeframe?.available ?? result.data.length > 0)
          setChartReason(result.timeframe?.reason ?? null)
        } else {
          const result = await getP2PNotionalHistory(
            side as "SELL" | "BUY",
            notional,
            range,
            timeframe as P2PTimeframeKey,
            { signal: controller.signal },
          )

          if (controller.signal.aborted) return

          const payload = result.data as P2PSideCandlesPayload

          setChartCandles(payload.data)
          setChartIndicators({})
          setChartAvailable(payload.available)
          setChartReason(payload.reason)
        }
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
  }, [timeframe, activeIndicators, side, notional, isDual, usingClassicSeries])

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

  /**
   * Lanza el análisis en streaming.
   *
   * `force` solo llega en true cuando el usuario pulsa "Actualizar
   * análisis". Sin él, si nada relevante cambió el backend devuelve el
   * análisis guardado sin invocar al modelo, y eso se nota porque el
   * texto aparece de golpe en vez de escribirse.
   */
  const runAiAnalysis = useCallback(async (force: boolean) => {
    aiRequestRef.current?.abort()

    const controller = new AbortController()
    aiRequestRef.current = controller

    setAiLoading(true)
    setAiStreaming(false)
    setAiError(null)
    setAiAnalysis(null)
    setAiStreamedText("")

    // El análisis solo entiende SELL/BUY; en modo "Ambos" se usa
    // SELL como protagonista (igual que el snapshot del panel).
    const analysisSide = side === "BOTH" ? "SELL" : side

    try {
      await streamP2PMarketAnalysis(
        {
          side: analysisSide,
          range: "1h",
          notional,
          force,
          signal: controller.signal,
        },
        {
          onMetadata: (data) => {
            if (controller.signal.aborted) return

            // La clasificación viene de Django, no del modelo: se
            // guarda para reutilizarla al cerrar el stream.
            aiClassificationRef.current = {
              market_state: data.market_state,
              risk_level: data.risk_level,
            }

            setAiCached(data.cached_analysis)
            setAiGeneratedAt(data.generated_at)
            setAiStreaming(!data.cached_analysis)
          },

          // Las métricas llegan antes del primer token: las tarjetas se
          // pintan de inmediato y el modelo solo alimenta la narrativa.
          onMetrics: (data) => {
            if (controller.signal.aborted) return

            setAiSnapshot(data.snapshot)
            setAiIntraday(data.intraday)
            setAiFxSupply(data.fx_supply_context)
            setAiLoading(false)
          },

          onToken: (content) => {
            if (controller.signal.aborted) return

            setAiStreamedText((previous) => previous + content)
          },

          onDone: (data) => {
            if (controller.signal.aborted) return

            setAiAnalysis({
              headline: data.headline,
              summary: data.analysis_text,
              market_state: aiClassificationRef.current.market_state,
              risk_level: aiClassificationRef.current.risk_level,
              observations: [],
            })
            setAiStreaming(false)
            setAiLoading(false)
          },

          onError: (err) => {
            if (controller.signal.aborted) return

            // El texto recibido hasta aquí se conserva a propósito.
            setAiStreaming(false)
            setAiLoading(false)
            setAiError(err.message)
          },
        },
      )
    } catch (err) {
      if (controller.signal.aborted) return

      setAiStreaming(false)

      setAiError(
        err instanceof MarketAnalysisError
          ? err.message
          : "Análisis IA no disponible temporalmente.",
      )
    } finally {
      if (!controller.signal.aborted) setAiLoading(false)
    }
  }, [side, notional])

  function openAiDrawer() {
    setAiOpen(true)
  }

  /** Cerrar el panel corta el stream: nada de conexiones colgando. */
  function closeAiDrawer() {
    aiRequestRef.current?.abort()
    setAiStreaming(false)
    setAiLoading(false)
    setAiOpen(false)
  }

  const activeTimeframeMeta = useMemo(
    () => timeframes.find((item) => item.key === timeframe) ?? null,
    [timeframes, timeframe],
  )

  const primaryAlert = snapshot?.alerts[0] ?? null

  const hasChartData = isDual
    ? sellCandles.length > 0 || buyCandles.length > 0
    : chartCandles.length > 0

  // En modo Ambos, dos juegos de velas a la vez son difíciles de leer:
  // se fuerza Línea, igual que pide el diseño.
  const effectiveChartMode: P2PChartMode = isDual ? "line" : chartMode

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
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <SideSelector value={side} onChange={handleSideChange} />
              <NotionalSelector value={notional} onChange={handleNotionalChange} levels={notionalLevels} />
            </div>

            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <TimeframeToolbar
                timeframes={timeframes}
                value={timeframe ?? "1h"}
                onChange={setTimeframe}
              />

              <div className="flex items-center gap-2">
                {usingClassicSeries && (
                  <IndicatorsMenu
                    active={new Set(activeIndicators)}
                    onToggle={toggleIndicator}
                  />
                )}

                {!isDual && (
                  <div className="hidden w-[140px] sm:block">
                    <SegmentedControl
                      options={CHART_MODE_OPTIONS}
                      value={chartMode}
                      onChange={setChartMode}
                      label="Tipo de gráfico"
                      size="sm"
                    />
                  </div>
                )}

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
            {!isDual && (
              <div className="mb-2 w-[140px] sm:hidden">
                <SegmentedControl
                  options={CHART_MODE_OPTIONS}
                  value={chartMode}
                  onChange={setChartMode}
                  label="Tipo de gráfico"
                  size="sm"
                />
              </div>
            )}

            {chartLoading && !hasChartData ? (
              <ChartSkeleton height={chartHeight} />
            ) : chartError && !hasChartData ? (
              <EmptyState icon="alert" title="No se pudo cargar el gráfico" description={chartError} height={chartHeight} />
            ) : !hasChartData || !chartAvailable ? (
              <EmptyState
                title={notional === REFERENCE_NOTIONAL ? "Aún no hay velas en este rango" : "Todavía no hay suficiente historial"}
                description={
                  chartReason ??
                  (notional === REFERENCE_NOTIONAL
                    ? "Prueba con otro timeframe o espera a que se acumulen más capturas."
                    : `El precio ponderado para ${notional} USDT empezó a guardarse recién con esta actualización: dale un poco de tiempo para acumular historial.`)
                }
                height={chartHeight}
              />
            ) : isDual ? (
              <P2PDualLineChart
                sellCandles={sellCandles}
                buyCandles={buyCandles}
                intervalSeconds={activeTimeframeMeta?.interval_seconds ?? 3600}
                height={chartHeight}
                resetSignal={resetSignal}
              />
            ) : (
              <P2PProChart
                candles={chartCandles}
                indicators={chartIndicators}
                activeIndicators={usingClassicSeries ? activeIndicators : []}
                intervalSeconds={activeTimeframeMeta?.interval_seconds ?? 3600}
                height={chartHeight}
                resetSignal={resetSignal}
                mode={effectiveChartMode}
              />
            )}
          </section>

          <p className="mt-3 flex items-center gap-1.5 px-1 text-[11px] text-[#3f4757]">
            {effectiveChartMode === "candles" ? (
              <CandleChartIcon className="h-3.5 w-3.5" />
            ) : (
              <LineChartIcon className="h-3.5 w-3.5" />
            )}
            USDT/VES · {side === "BOTH" ? "SELL + BUY" : side} · {notional} USDT · velas de{" "}
            {activeTimeframeMeta?.label ?? timeframe}
          </p>

          {/* Estado del mercado también aquí en móvil, debajo del chart. */}
          {snapshot && (
            <div className="mt-4 space-y-4 lg:hidden">
              <MarketStatusPanel snapshot={snapshot} />
              <FxSupplyCard
                context={snapshot.fx_supply_context ?? null}
                dayStats={snapshot.fx_supply_day_stats ?? null}
              />
            </div>
          )}
        </div>

        {/* Panel lateral solo en desktop. */}
        {snapshot && (
          <div className="mt-4 hidden space-y-4 lg:mt-0 lg:block">
            <MarketStatusPanel snapshot={snapshot} />
            <FxSupplyCard
              context={snapshot.fx_supply_context ?? null}
              dayStats={snapshot.fx_supply_day_stats ?? null}
            />
          </div>
        )}
      </div>

      {aiAvailable && <AiFloatingButton onClick={openAiDrawer} />}

      <P2PAiDrawer
        open={aiOpen}
        loading={aiLoading}
        streaming={aiStreaming}
        error={aiError}
        analysis={aiAnalysis}
        streamedText={aiStreamedText}
        snapshot={aiSnapshot}
        intraday={aiIntraday}
        fxSupply={aiFxSupply}
        generatedAt={aiGeneratedAt}
        cached={aiCached}
        onClose={closeAiDrawer}
        onAnalyze={runAiAnalysis}
        onOpenHistory={() => setAiHistoryOpen(true)}
      />

      <AiHistorySheet
        open={aiHistoryOpen}
        onClose={() => setAiHistoryOpen(false)}
      />
    </main>
  )
}
