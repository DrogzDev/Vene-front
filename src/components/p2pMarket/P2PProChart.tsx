import { useEffect, useMemo, useRef, useState } from "react"
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
} from "lightweight-charts"
import type {
  CandlestickData,
  HistogramData,
  IChartApi,
  ISeriesApi,
  LineData,
  MouseEventParams,
  Time,
  UTCTimestamp,
} from "lightweight-charts"

import type { P2PChartCandle, P2PIndicatorSeries } from "../../types/prices"
import { formatBs } from "../../utils/format"
import { formatFullTime, formatReadoutTime, formatTickMark } from "../priceHistory/chartFormat"
import { COLORS } from "./theme"
import { PRICE } from "../priceHistory/theme"
import { INDICATOR_OPTIONS } from "./IndicatorsMenu"
import type { IndicatorKey } from "./IndicatorsMenu"

// Separador de paneles: gris translúcido, legible en tema claro y oscuro
// (el canvas no entiende variables CSS).
const CHART_SEPARATOR = "rgba(128, 132, 138, 0.18)"

export type P2PChartMode = "candles" | "line"

type Readout = {
  time: number
  open: number
  high: number
  low: number
  close: number
  changePercent: number
}

type Props = {
  candles: P2PChartCandle[]
  indicators: P2PIndicatorSeries
  activeIndicators: IndicatorKey[]
  intervalSeconds: number
  height: number
  resetSignal: number
  mode: P2PChartMode
}

function toCandleData(candles: P2PChartCandle[]): CandlestickData<Time>[] {
  return candles.map((candle) => ({
    time: candle.time as UTCTimestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  }))
}

function toCloseLineData(candles: P2PChartCandle[]): LineData<Time>[] {
  return candles.map((candle) => ({ time: candle.time as UTCTimestamp, value: candle.close }))
}

function toActivityData(candles: P2PChartCandle[]): HistogramData<Time>[] {
  return candles.map((candle) => ({
    time: candle.time as UTCTimestamp,
    value: candle.samples,
    color: "rgba(139, 147, 163, 0.35)",
  }))
}

function toIndicatorLineData(candles: P2PChartCandle[], values: (number | null)[]): LineData<Time>[] {
  const rows: LineData<Time>[] = []

  for (let i = 0; i < candles.length; i += 1) {
    const value = values[i]

    if (value == null) continue

    rows.push({ time: candles[i].time as UTCTimestamp, value })
  }

  return rows
}

function readoutFromCandle(candle: P2PChartCandle): Readout {
  const changePercent = candle.open ? ((candle.close - candle.open) / candle.open) * 100 : 0

  return {
    time: candle.time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    changePercent,
  }
}

/**
 * Chart de la Vista Profesional: velas (por defecto) o línea, hasta
 * tres medias móviles superpuestas y un panel inferior de actividad
 * P2P (número de capturas/anuncios por vela — nunca "volumen", porque
 * no medimos monto transado, solo frecuencia de muestreo).
 *
 * El chart y sus panes se crean una sola vez; cambiar de timeframe,
 * modo o indicadores actualiza las series existentes.
 */
export default function P2PProChart({
  candles,
  indicators,
  activeIndicators,
  intervalSeconds,
  height,
  resetSignal,
  mode,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const activitySeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
  const indicatorSeriesRef = useRef<Map<IndicatorKey, ISeriesApi<"Line">>>(new Map())

  const [readout, setReadout] = useState<Readout | null>(null)

  const candleData = useMemo(() => toCandleData(candles), [candles])
  const lineData = useMemo(() => toCloseLineData(candles), [candles])
  const activityData = useMemo(() => toActivityData(candles), [candles])

  const readoutInterval: "hour" | "day" = intervalSeconds >= 86400 ? "day" : "hour"

  // El readout muestra la vela activa del crosshair o, si no hay
  // ninguna, la última vela real (nunca datos inventados).
  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null
  const displayedReadout = readout ?? (lastCandle ? readoutFromCandle(lastCandle) : null)

  // ---------------------------------------------------------
  // Creación del chart (una sola vez) + pane de actividad
  // ---------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: COLORS.textMuted,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
        fontSize: 11,
        attributionLogo: false,
        panes: {
          separatorColor: CHART_SEPARATOR,
          separatorHoverColor: "rgba(255,255,255,0.06)",
        },
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: COLORS.grid, style: LineStyle.Solid },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.08 },
        entireTextOnly: true,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 3,
        barSpacing: 8,
        minBarSpacing: 3,
        lockVisibleTimeRangeOnResize: true,
        tickMarkFormatter: formatTickMark,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(255,255,255,0.22)",
          width: 1,
          labelBackgroundColor: COLORS.surfaceSoft,
        },
        horzLine: {
          color: "rgba(255,255,255,0.22)",
          width: 1,
          labelBackgroundColor: COLORS.surfaceSoft,
        },
      },
      localization: {
        locale: "es-VE",
        priceFormatter: formatBs,
        timeFormatter: (time: Time) => formatFullTime(time),
      },
      handleScale: {
        axisPressedMouseMove: { time: true, price: false },
      },
    })

    chartRef.current = chart

    const activitySeries = chart.addSeries(
      HistogramSeries,
      {
        color: "rgba(139, 147, 163, 0.35)",
        priceFormat: { type: "volume" },
        priceLineVisible: false,
        lastValueVisible: false,
      },
      1,
    )

    activitySeriesRef.current = activitySeries

    // El panel de actividad ocupa una fracción discreta del alto
    // total: el candlestick/línea sigue siendo el protagonista.
    const panes = chart.panes()
    if (panes[1]) {
      panes[1].setHeight(Math.round(height * 0.18))
    }

    // Se captura aquí, no en el cleanup: el Map en sí nunca cambia de
    // identidad (se crea una sola vez con useRef), solo su contenido.
    const indicatorMap = indicatorSeriesRef.current

    return () => {
      chart.remove()

      chartRef.current = null
      candleSeriesRef.current = null
      lineSeriesRef.current = null
      activitySeriesRef.current = null
      indicatorMap.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------
  // Serie principal (velas o línea) según el modo
  // ---------------------------------------------------------
  useEffect(() => {
    const chart = chartRef.current

    if (!chart) return

    if (mode === "candles") {
      if (lineSeriesRef.current) {
        chart.removeSeries(lineSeriesRef.current)
        lineSeriesRef.current = null
      }

      if (!candleSeriesRef.current) {
        candleSeriesRef.current = chart.addSeries(
          CandlestickSeries,
          {
            // Convención estándar: vela que sube verde, que baja roja (ver PRICE).
            upColor: PRICE.rise,
            downColor: PRICE.fall,
            borderUpColor: PRICE.rise,
            borderDownColor: PRICE.fall,
            wickUpColor: PRICE.rise,
            wickDownColor: PRICE.fall,
            priceLineVisible: false,
            priceFormat: { type: "price", precision: 2, minMove: 0.01 },
          },
          0,
        )
      }

      candleSeriesRef.current.setData(candleData)
    } else {
      if (candleSeriesRef.current) {
        chart.removeSeries(candleSeriesRef.current)
        candleSeriesRef.current = null
      }

      if (!lineSeriesRef.current) {
        lineSeriesRef.current = chart.addSeries(
          LineSeries,
          {
            color: "#a3e635",
            lineWidth: 2,
            priceLineVisible: false,
            priceFormat: { type: "price", precision: 2, minMove: 0.01 },
          },
          0,
        )
      }

      lineSeriesRef.current.setData(lineData)
    }

    chart.timeScale().fitContent()
  }, [mode, candleData, lineData])

  // ---------------------------------------------------------
  // Actividad P2P
  // ---------------------------------------------------------
  useEffect(() => {
    activitySeriesRef.current?.setData(activityData)
  }, [activityData])

  // ---------------------------------------------------------
  // Medias móviles activas
  // ---------------------------------------------------------
  useEffect(() => {
    const chart = chartRef.current

    if (!chart) return

    const activeSet = new Set(activeIndicators)

    for (const [key, series] of indicatorSeriesRef.current.entries()) {
      if (!activeSet.has(key)) {
        chart.removeSeries(series)
        indicatorSeriesRef.current.delete(key)
      }
    }

    for (const key of activeIndicators) {
      const option = INDICATOR_OPTIONS.find((item) => item.key === key)
      if (!option) continue

      let series = indicatorSeriesRef.current.get(key)

      if (!series) {
        series = chart.addSeries(
          LineSeries,
          {
            color: option.color,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          },
          0,
        )

        indicatorSeriesRef.current.set(key, series)
      }

      series.setData(toIndicatorLineData(candles, indicators[key] ?? []))
    }
  }, [activeIndicators, indicators, candles])

  // ---------------------------------------------------------
  // Reset de zoom
  // ---------------------------------------------------------
  useEffect(() => {
    if (resetSignal > 0) {
      chartRef.current?.timeScale().fitContent()
    }
  }, [resetSignal])

  // ---------------------------------------------------------
  // Crosshair -> lectura OHLC (siempre a partir de la vela real,
  // incluso en modo línea, para no perder máximo/mínimo del período).
  // ---------------------------------------------------------
  useEffect(() => {
    const chart = chartRef.current

    if (!chart) return

    function handleMove(param: MouseEventParams<Time>) {
      if (!param.time) {
        setReadout(null)
        return
      }

      const candle = candles.find((item) => item.time === (param.time as number))

      setReadout(candle ? readoutFromCandle(candle) : null)
    }

    chart.subscribeCrosshairMove(handleMove)

    return () => {
      chart.unsubscribeCrosshairMove(handleMove)
    }
  }, [candles])

  const isUp = (displayedReadout?.changePercent ?? 0) >= 0

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-1.5 text-[11px] tabular-nums">
        {displayedReadout ? (
          <>
            <span className="text-ink-faint">
              O{" "}
              <span className="font-semibold text-ink-soft">
                {formatBs(displayedReadout.open)}
              </span>
            </span>
            <span className="text-ink-faint">
              H{" "}
              <span className="font-semibold text-ink-soft">
                {formatBs(displayedReadout.high)}
              </span>
            </span>
            <span className="text-ink-faint">
              L{" "}
              <span className="font-semibold text-ink-soft">
                {formatBs(displayedReadout.low)}
              </span>
            </span>
            <span className="text-ink-faint">
              C{" "}
              <span className="font-semibold text-ink-soft">
                {formatBs(displayedReadout.close)}
              </span>
            </span>
            <span className="font-semibold" style={{ color: isUp ? PRICE.rise : PRICE.fall }}>
              {isUp ? "+" : "−"}
              {Math.abs(displayedReadout.changePercent).toFixed(2)}%
            </span>
            <span className="hidden text-ink-faint sm:inline">
              {formatReadoutTime(displayedReadout.time, readoutInterval)}
            </span>
          </>
        ) : (
          <span className="text-ink-faint">Sin velas en este rango</span>
        )}
      </div>

      <div ref={containerRef} className="w-full touch-pan-y" style={{ height }} />
    </div>
  )
}
