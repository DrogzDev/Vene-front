import { useEffect, useMemo, useRef, useState } from "react"
import { ColorType, CrosshairMode, HistogramSeries, LineSeries, LineStyle, createChart } from "lightweight-charts"
import type {
  HistogramData,
  IChartApi,
  ISeriesApi,
  LineData,
  MouseEventParams,
  Time,
  UTCTimestamp,
} from "lightweight-charts"

import type { P2PSideCandle } from "../../types/prices"
import { formatBs } from "../../utils/format"
import { formatFullTime, formatReadoutTime, formatTickMark } from "../priceHistory/chartFormat"
import { COLORS } from "./theme"

// Separador de paneles: gris translúcido, legible en tema claro y oscuro
// (el canvas no entiende variables CSS).
const CHART_SEPARATOR = "rgba(128, 132, 138, 0.18)"

const SELL_COLOR = "#C9A86A"
const BUY_COLOR = "#10C7B0"

type Readout = {
  time: number
  sellPrice: number | null
  buyPrice: number | null
  spreadPercent: number | null
}

type Props = {
  sellCandles: P2PSideCandle[]
  buyCandles: P2PSideCandle[]
  intervalSeconds: number
  height: number
  resetSignal: number
}

function toLineData(candles: P2PSideCandle[]): LineData<Time>[] {
  return candles.map((candle) => ({ time: candle.time as UTCTimestamp, value: candle.close }))
}

function toActivityData(sell: P2PSideCandle[], buy: P2PSideCandle[]): HistogramData<Time>[] {
  const byTime = new Map<number, number>()

  for (const candle of sell) {
    byTime.set(candle.time, (byTime.get(candle.time) ?? 0) + candle.activity)
  }

  for (const candle of buy) {
    byTime.set(candle.time, (byTime.get(candle.time) ?? 0) + candle.activity)
  }

  return Array.from(byTime.entries())
    .sort(([a], [b]) => a - b)
    .map(([time, value]) => ({
      time: time as UTCTimestamp,
      value: Math.round(value / 2),
      color: "rgba(139, 147, 163, 0.35)",
    }))
}

/**
 * Modo "Ambos": SELL y BUY superpuestos en Línea. Se usa un componente
 * dedicado (no P2PProChart) porque la fuente de datos es distinta: el
 * order book agregado (P2PMarketSnapshot) en vez de capturas crudas.
 */
export default function P2PDualLineChart({
  sellCandles,
  buyCandles,
  intervalSeconds,
  height,
  resetSignal,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const sellSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const buySeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const activitySeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)

  const [readout, setReadout] = useState<Readout | null>(null)

  const sellData = useMemo(() => toLineData(sellCandles), [sellCandles])
  const buyData = useMemo(() => toLineData(buyCandles), [buyCandles])
  const activityData = useMemo(() => toActivityData(sellCandles, buyCandles), [sellCandles, buyCandles])

  const readoutInterval: "hour" | "day" = intervalSeconds >= 86400 ? "day" : "hour"

  const lastSell = sellCandles.at(-1) ?? null
  const lastBuy = buyCandles.at(-1) ?? null

  const fallbackReadout: Readout | null =
    lastSell || lastBuy
      ? {
          time: (lastSell ?? lastBuy)!.time,
          sellPrice: lastSell?.close ?? null,
          buyPrice: lastBuy?.close ?? null,
          spreadPercent:
            lastSell && lastBuy && lastSell.close
              ? ((lastBuy.close - lastSell.close) / lastSell.close) * 100
              : null,
        }
      : null

  const displayed = readout ?? fallbackReadout

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
        panes: { separatorColor: CHART_SEPARATOR, separatorHoverColor: "rgba(255,255,255,0.06)" },
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: COLORS.grid, style: LineStyle.Solid },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.14, bottom: 0.08 },
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
        vertLine: { color: "rgba(255,255,255,0.22)", width: 1, labelBackgroundColor: COLORS.surfaceSoft },
        horzLine: { color: "rgba(255,255,255,0.22)", width: 1, labelBackgroundColor: COLORS.surfaceSoft },
      },
      localization: {
        locale: "es-VE",
        priceFormatter: formatBs,
        timeFormatter: (time: Time) => formatFullTime(time),
      },
      handleScale: { axisPressedMouseMove: { time: true, price: false } },
    })

    chartRef.current = chart

    sellSeriesRef.current = chart.addSeries(
      LineSeries,
      {
        color: SELL_COLOR,
        lineWidth: 2,
        priceLineVisible: false,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      },
      0,
    )

    buySeriesRef.current = chart.addSeries(
      LineSeries,
      {
        color: BUY_COLOR,
        lineWidth: 2,
        priceLineVisible: false,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      },
      0,
    )

    activitySeriesRef.current = chart.addSeries(
      HistogramSeries,
      {
        color: "rgba(139, 147, 163, 0.35)",
        priceFormat: { type: "volume" },
        priceLineVisible: false,
        lastValueVisible: false,
      },
      1,
    )

    const panes = chart.panes()
    if (panes[1]) panes[1].setHeight(Math.round(height * 0.18))

    return () => {
      chart.remove()
      chartRef.current = null
      sellSeriesRef.current = null
      buySeriesRef.current = null
      activitySeriesRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    sellSeriesRef.current?.setData(sellData)
    buySeriesRef.current?.setData(buyData)
    chartRef.current?.timeScale().fitContent()
  }, [sellData, buyData])

  useEffect(() => {
    activitySeriesRef.current?.setData(activityData)
  }, [activityData])

  useEffect(() => {
    if (resetSignal > 0) chartRef.current?.timeScale().fitContent()
  }, [resetSignal])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    function handleMove(param: MouseEventParams<Time>) {
      if (!param.time) {
        setReadout(null)
        return
      }

      const time = param.time as number

      const sellPoint = sellCandles.find((candle) => candle.time === time)
      const buyPoint = buyCandles.find((candle) => candle.time === time)

      if (!sellPoint && !buyPoint) {
        setReadout(null)
        return
      }

      const sellPrice = sellPoint?.close ?? null
      const buyPrice = buyPoint?.close ?? null

      setReadout({
        time,
        sellPrice,
        buyPrice,
        spreadPercent:
          sellPrice && buyPrice ? ((buyPrice - sellPrice) / sellPrice) * 100 : null,
      })
    }

    chart.subscribeCrosshairMove(handleMove)

    return () => chart.unsubscribeCrosshairMove(handleMove)
  }, [sellCandles, buyCandles])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-1.5 text-[11px] tabular-nums">
        {displayed ? (
          <>
            <span className="flex items-center gap-1.5 text-ink-faint">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SELL_COLOR }} />
              Vender{" "}
              <span className="font-semibold text-ink-soft">
                {displayed.sellPrice != null ? `Bs ${formatBs(displayed.sellPrice)}` : "—"}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-ink-faint">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BUY_COLOR }} />
              Comprar{" "}
              <span className="font-semibold text-ink-soft">
                {displayed.buyPrice != null ? `Bs ${formatBs(displayed.buyPrice)}` : "—"}
              </span>
            </span>
            {displayed.spreadPercent != null && (
              <span className="text-ink-muted">
                Spread{" "}
                <span className="font-semibold text-ink-soft">
                  {displayed.spreadPercent.toFixed(2)}%
                </span>
              </span>
            )}
            <span className="hidden text-ink-faint sm:inline">
              {formatReadoutTime(displayed.time, readoutInterval)}
            </span>
          </>
        ) : (
          <span className="text-ink-faint">Sin datos en este rango todavía</span>
        )}
      </div>

      <div ref={containerRef} className="w-full touch-pan-y" style={{ height }} />
    </div>
  )
}
