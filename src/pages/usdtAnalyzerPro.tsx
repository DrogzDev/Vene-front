import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Maximize2, SlidersHorizontal } from "lucide-react"

import {
  getP2PMarketCurrent,
  getP2PNotionalHistory,
  getP2PTimeframeCandles,
} from "../services/pricesApi"
import type {
  P2PChartCandle,
  P2PHistoryRange,
  P2PIndicatorSeries,
  P2PMarketStatusResponse,
  P2PSideCandle,
  P2PSideCandlesPayload,
  P2PSideSelection,
  P2PSupportedTimeframe,
  P2PTimeframeKey,
} from "../types/prices"
import { getStoredP2PNotional, setStoredP2PNotional } from "../utils/p2pPreferences"

import MarketStatsDisclosure from "../components/p2pMarket/MarketStatsGrid"
import TimeframeToolbar from "../components/p2pMarket/TimeframeToolbar"
import IndicatorsMenu from "../components/p2pMarket/IndicatorsMenu"
import type { IndicatorKey } from "../components/p2pMarket/IndicatorsMenu"
import ChartToolsSheet from "../components/p2pMarket/ChartToolsSheet"
import MarketStatusCompact from "../components/p2pMarket/MarketStatusCompact"
import SideSelector from "../components/p2pMarket/SideSelector"
import P2PProChart from "../components/p2pMarket/P2PProChart"
import type { P2PChartMode } from "../components/p2pMarket/P2PProChart"
import P2PDualLineChart from "../components/p2pMarket/P2PDualLineChart"
import MarketStatusPanel from "../components/p2pMarket/MarketStatusPanel"
import FxSupplyCard from "../components/p2pMarket/FxSupplyCard"
import RapidDropAlertCard from "../components/p2pMarket/RapidDropAlertCard"
import MarketAiSheets from "../components/p2pMarket/MarketAiSheets"
import { useP2PAiAnalysis } from "../components/p2pMarket/useP2PAiAnalysis"
import { ChartSkeleton, EmptyState } from "../components/priceHistory/states"
import SegmentedControl from "../components/priceHistory/SegmentedControl"
import { AnalyzeCta } from "../components/ui/ChartCard"
import FullscreenChart from "../components/ui/FullscreenChart"
import { IconButton, Notice } from "../components/ui/primitives"
import { useCrossfade } from "../motion/useCrossfade"

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
  const [height, setHeight] = useState(340)

  useEffect(() => {
    function update() {
      const width = window.innerWidth

      if (width >= 1024) {
        setHeight(460)
      } else if (width >= 640) {
        setHeight(380)
      } else {
        // Proporcional a la pantalla real, entre 260 y 340 px: el
        // gráfico y sus controles caben en la primera pantalla.
        setHeight(Math.max(260, Math.min(340, Math.round(window.innerHeight * 0.36))))
      }
    }

    update()
    window.addEventListener("resize", update)

    return () => window.removeEventListener("resize", update)
  }, [])

  return height
}

type Props = {
  /** Snapshot del mercado: lo carga la página, compartido con la cabecera. */
  snapshot: P2PMarketStatusResponse | null
  snapshotLoading: boolean
  snapshotError: string
  side: P2PSideSelection
  onSideChange: (side: P2PSideSelection) => void
}

/**
 * Cuerpo de la Vista Profesional. La cabecera de precio y el selector de
 * vista los pinta la página (usdtAnalyzer.tsx); aquí va de los controles
 * del gráfico hacia abajo.
 */
export default function UsdtAnalyzerPro({ snapshot, snapshotLoading, snapshotError, side, onSideChange }: Props) {
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
  const [toolsOpen, setToolsOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const closeExpanded = useCallback(() => setExpanded(false), [])
  const [resetSignal, setResetSignal] = useState(0)

  const ai = useP2PAiAnalysis(side, notional)
  const chartRef = useRef<HTMLDivElement | null>(null)

  const chartHeight = useProChartHeight()

  const isDual = side === "BOTH"
  const usingClassicSeries = !isDual && notional === REFERENCE_NOTIONAL

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
  // Timeframes soportados: se sondean contra la serie clásica (SELL,
  // notional de referencia), la más densa y estable.
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
  // Datos del chart: clásico (rico en historia) o multi-notional.
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

        setChartError(err instanceof Error ? err.message : "No se pudo cargar el gráfico profesional.")
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

  const activeTimeframeMeta = useMemo(
    () => timeframes.find((item) => item.key === timeframe) ?? null,
    [timeframes, timeframe],
  )

  const primaryAlert = snapshot?.alerts[0] ?? null

  const hasChartData = isDual ? sellCandles.length > 0 || buyCandles.length > 0 : chartCandles.length > 0

  // En modo Ambos, dos juegos de velas a la vez son difíciles de leer:
  // se fuerza Línea.
  const effectiveChartMode: P2PChartMode = isDual ? "line" : chartMode

  const indicatorsAvailable = usingClassicSeries
  const activeIndicatorSet = useMemo(() => new Set(activeIndicators), [activeIndicators])

  function renderChart(height: number) {
    if (chartLoading && !hasChartData) return <ChartSkeleton height={height} />

    if (chartError && !hasChartData) {
      return <EmptyState icon="alert" title="No se pudo cargar el gráfico" description={chartError} height={height} />
    }

    if (!hasChartData || !chartAvailable) {
      return (
        <EmptyState
          title={notional === REFERENCE_NOTIONAL ? "Aún no hay velas en este rango" : "Todavía no hay suficiente historial"}
          description={
            chartReason ??
            (notional === REFERENCE_NOTIONAL
              ? "Prueba con otro timeframe o espera a que se acumulen más capturas."
              : `El precio ponderado para ${notional} USDT empezó a guardarse recién con esta actualización: dale un poco de tiempo para acumular historial.`)
          }
          height={height}
        />
      )
    }

    if (isDual) {
      return (
        <P2PDualLineChart
          sellCandles={sellCandles}
          buyCandles={buyCandles}
          intervalSeconds={activeTimeframeMeta?.interval_seconds ?? 3600}
          height={height}
          resetSignal={resetSignal}
        />
      )
    }

    return (
      <P2PProChart
        candles={chartCandles}
        indicators={chartIndicators}
        activeIndicators={usingClassicSeries ? activeIndicators : []}
        intervalSeconds={activeTimeframeMeta?.interval_seconds ?? 3600}
        height={height}
        resetSignal={resetSignal}
        mode={effectiveChartMode}
      />
    )
  }

  // Otro timeframe, lado o monto: transición breve del gráfico.
  useCrossfade(chartRef, `${timeframe}-${side}-${notional}`)

  const chartCaption = `USDT/VES · ${side === "BOTH" ? "SELL + BUY" : side} · ${notional} USDT · velas de ${
    activeTimeframeMeta?.label ?? timeframe ?? ""
  }`

  return (
    <>
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-4">
        <div className="min-w-0 space-y-3">
          {snapshotError && !snapshotLoading && <Notice>{snapshotError}</Notice>}

          {/* Gráfico sin card: timeframes arriba y el canvas a todo el ancho. */}
          <div data-enter>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <TimeframeToolbar timeframes={timeframes} value={timeframe ?? "1h"} onChange={setTimeframe} />
              </div>
              <IconButton label="Pantalla completa" onClick={() => setExpanded(true)} disabled={!hasChartData}>
                <Maximize2 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </IconButton>
            </div>

            <div ref={chartRef} className="mt-1.5">
              {renderChart(chartHeight)}
            </div>
          </div>

          {/* Controles debajo del gráfico: lado + medias móviles, y tipo de
              gráfico + herramientas (monto, zoom) en un sheet. */}
          <div data-enter className="space-y-2">
            <div className="flex items-center gap-2">
              <SideSelector value={side} onChange={onSideChange} className="w-[172px] shrink-0" />
              {indicatorsAvailable && (
                <div className="min-w-0 flex-1">
                  <IndicatorsMenu active={activeIndicatorSet} onToggle={toggleIndicator} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-[172px] shrink-0 ${isDual ? "pointer-events-none opacity-50" : ""}`}
                title={isDual ? "Con SELL y BUY a la vez el gráfico se muestra en línea." : undefined}
              >
                <SegmentedControl
                  options={CHART_MODE_OPTIONS}
                  value={effectiveChartMode}
                  onChange={setChartMode}
                  label="Tipo de gráfico"
                  size="xs"
                />
              </div>
              <div className="flex-1" />
              <IconButton
                label="Herramientas del gráfico"
                active={notional !== REFERENCE_NOTIONAL || activeIndicators.length > 0}
                onClick={() => setToolsOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </IconButton>
            </div>
          </div>

          {primaryAlert && snapshot && (
            <div data-enter>
              <RapidDropAlertCard alert={primaryAlert} snapshot={snapshot} onViewAnalysis={ai.openDrawer} />
            </div>
          )}

          {ai.aiAvailable && (
            <div data-enter>
              <AnalyzeCta subtitle="Obtén una lectura del estado actual del mercado" onClick={ai.openDrawer} />
            </div>
          )}

          {snapshot && (
            <div data-enter className="space-y-3 lg:hidden">
              <MarketStatusCompact snapshot={snapshot} />
              <FxSupplyCard
                collapsible
                context={snapshot.fx_supply_context ?? null}
                dayStats={snapshot.fx_supply_day_stats ?? null}
              />
            </div>
          )}

          <div data-enter>
            <MarketStatsDisclosure snapshot={snapshot} />
          </div>
        </div>

        {/* Panel lateral solo en escritorio. */}
        {snapshot && (
          <div className="hidden space-y-4 lg:block">
            <MarketStatusPanel snapshot={snapshot} />
            <FxSupplyCard context={snapshot.fx_supply_context ?? null} dayStats={snapshot.fx_supply_day_stats ?? null} />
          </div>
        )}
      </div>

      <ChartToolsSheet
        open={toolsOpen}
        onClose={() => setToolsOpen(false)}
        notional={notional}
        notionalLevels={notionalLevels}
        onNotionalChange={handleNotionalChange}
        referenceNotional={REFERENCE_NOTIONAL}
        chartMode={chartMode}
        onChartModeChange={setChartMode}
        modeLocked={isDual}
        indicatorsAvailable={indicatorsAvailable}
        activeIndicators={activeIndicators}
        onToggleIndicator={toggleIndicator}
        onResetZoom={() => setResetSignal((value) => value + 1)}
      />

      <FullscreenChart open={expanded} onClose={closeExpanded} title="USDT / VES" subtitle={chartCaption}>
        {(height) => renderChart(height)}
      </FullscreenChart>

      <MarketAiSheets ai={ai} />
    </>
  )
}
