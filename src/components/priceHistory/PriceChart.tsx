import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
} from "lightweight-charts"
import type {
  CandlestickData,
  IChartApi,
  ISeriesApi,
  LineData,
  MouseEventParams,
  Time,
  UTCTimestamp,
} from "lightweight-charts"

import type {
  PriceCandle,
  PriceChartPoint,
  PriceChartRange,
  PriceSource,
} from "../../types/prices"
import { formatBs, formatPriceAxis } from "../../utils/format"
import { formatFullTime, formatReadoutTime, formatTickMark } from "./chartFormat"
import { COLORS, PRICE } from "./theme"
import type { SourceOption } from "./theme"

export type ChartMode = "line" | "candles"

/** Campo del punto de la gráfica que corresponde a cada fuente. */
const SOURCE_FIELD: Record<PriceSource, keyof PriceChartPoint> = {
  average: "average_price",
  bcv: "bcv",
  usdt: "binance_best_price",
  eur: "eur_bcv",
}

type Props = {
  points: PriceChartPoint[]
  candles: PriceCandle[]
  mode: ChartMode
  source: SourceOption
  sourceKey: PriceSource
  range: PriceChartRange
  /** Velas por hora o por día: cambia el formato de los ejes. */
  interval: "hour" | "day"
  /** Píxeles o cualquier alto CSS (p. ej. "clamp(240px, 33dvh, 300px)"). */
  height: number | string
  /**
   * Cada incremento devuelve el chart a su encuadre original. Se pasa
   * como señal en vez de exponer el objeto chart al padre.
   */
  resetSignal: number
}

type Readout = {
  time: number
  price: number
  open?: number
  high?: number
  low?: number
  close?: number
  changePercent?: number
}

type TooltipState = {
  left: number
  top: number
  visible: boolean
}

// =========================================================
// PREPARACIÓN DE DATOS
// =========================================================

function toLineData(points: PriceChartPoint[], sourceKey: PriceSource): LineData<Time>[] {
  const field = SOURCE_FIELD[sourceKey]

  const rows: LineData<Time>[] = []
  let lastTime = -Infinity

  for (const point of points) {
    const value = point[field]

    if (typeof value !== "number" || Number.isNaN(value)) continue

    const seconds = Math.floor(new Date(point.at).getTime() / 1000)

    if (!Number.isFinite(seconds)) continue

    // lightweight-charts exige tiempos estrictamente crecientes.
    if (seconds <= lastTime) continue

    lastTime = seconds

    rows.push({ time: seconds as UTCTimestamp, value })
  }

  return rows
}

/** "#20D6A0" + 0.16 → "rgba(32, 214, 160, 0.16)". */
function withAlpha(hex: string, alpha: number) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)

  if (!match) return hex

  const value = parseInt(match[1], 16)

  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}

function toCandleData(candles: PriceCandle[]): CandlestickData<Time>[] {
  return candles.map((candle) => ({
    time: candle.time as UTCTimestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  }))
}

// =========================================================
// COMPONENTE
// =========================================================

/**
 * Gráfico de precios con dos modos.
 *
 * El chart se crea una sola vez y se mantiene vivo: cambiar de serie,
 * de rango o de modo actualiza los datos de la serie existente en vez
 * de reconstruir el canvas entero. El chart se destruye al desmontar,
 * junto con su ResizeObserver interno y la suscripción al crosshair.
 */
export default function PriceChart({
  points,
  candles,
  mode,
  source,
  sourceKey,
  interval,
  height,
  resetSignal,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Area"> | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)

  const [readout, setReadout] = useState<Readout | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({
    left: 0,
    top: 0,
    visible: false,
  })

  const lineData = useMemo(() => toLineData(points, sourceKey), [points, sourceKey])
  const candleData = useMemo(() => toCandleData(candles), [candles])

  // Una lectura del crosshair pertenece a un conjunto de datos
  // concreto. Al cambiar de modo, de serie o de rango se descarta
  // durante el render, que es el patrón que React recomienda para
  // invalidar estado derivado sin encadenar renders desde un efecto.
  const dataToken = `${mode}|${sourceKey}|${lineData.length}|${candleData.length}|${lineData[0]?.time ?? 0}|${candleData[0]?.time ?? 0}`
  const [activeToken, setActiveToken] = useState(dataToken)

  if (activeToken !== dataToken) {
    setActiveToken(dataToken)
    setReadout(null)
    setTooltip((state) => (state.visible ? { ...state, visible: false } : state))
  }

  // ---------------------------------------------------------
  // Creación del chart (una sola vez)
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
      },
      grid: {
        // Rejilla extremadamente sutil: guía sin competir con la línea.
        vertLines: { visible: false },
        horzLines: { color: COLORS.grid, style: LineStyle.Solid },
      },
      rightPriceScale: {
        borderVisible: false,
        // Aire arriba y abajo para que el último movimiento no quede
        // pegado al borde del canvas.
        scaleMargins: { top: 0.16, bottom: 0.12 },
        entireTextOnly: true,
        ticksVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 3,
        barSpacing: 10,
        minBarSpacing: 4,
        lockVisibleTimeRangeOnResize: true,
        ticksVisible: false,
        tickMarkFormatter: formatTickMark,
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: "rgba(255,255,255,0.22)",
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: COLORS.surfaceSoft,
        },
        horzLine: {
          color: "rgba(255,255,255,0.22)",
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: COLORS.surfaceSoft,
        },
      },
      localization: {
        locale: "es-VE",
        // El eje de precio y las etiquetas del crosshair muestran
        // siempre el precio completo con dos decimales.
        priceFormatter: formatPriceAxis,
        timeFormatter: formatFullTime,
      },
      handleScale: {
        axisPressedMouseMove: { time: true, price: false },
      },
      kineticScroll: { touch: true, mouse: false },
    })

    chartRef.current = chart

    return () => {
      chart.remove()

      chartRef.current = null
      lineSeriesRef.current = null
      candleSeriesRef.current = null
    }
  }, [])

  // ---------------------------------------------------------
  // Altura
  // ---------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current

    if (container) {
      container.style.height = typeof height === "number" ? `${height}px` : height
    }
  }, [height])

  // ---------------------------------------------------------
  // Serie activa y datos
  // ---------------------------------------------------------
  useEffect(() => {
    const chart = chartRef.current

    if (!chart) return

    if (mode === "line") {
      if (candleSeriesRef.current) {
        chart.removeSeries(candleSeriesRef.current)
        candleSeriesRef.current = null
      }

      if (!lineSeriesRef.current) {
        // Área con un relleno muy tenue bajo la línea: precio y
        // gráfico se leen como una sola pieza.
        lineSeriesRef.current = chart.addSeries(AreaSeries, {
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          crosshairMarkerBorderWidth: 2,
          priceFormat: { type: "price", precision: 2, minMove: 0.01 },
        })
      }

      lineSeriesRef.current.applyOptions({
        lineColor: source.color,
        topColor: withAlpha(source.color, 0.16),
        bottomColor: withAlpha(source.color, 0),
        crosshairMarkerBackgroundColor: source.color,
        crosshairMarkerBorderColor: COLORS.background,
        // Los puntos solo aportan cuando hay pocas muestras; con
        // muchas se convierten en ruido.
        pointMarkersVisible: lineData.length > 0 && lineData.length <= 24,
        pointMarkersRadius: 2.5,
      })

      lineSeriesRef.current.setData(lineData)
    } else {
      if (lineSeriesRef.current) {
        chart.removeSeries(lineSeriesRef.current)
        lineSeriesRef.current = null
      }

      if (!candleSeriesRef.current) {
        candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
          // Convención estándar: vela que sube verde, que baja roja (ver PRICE).
          upColor: PRICE.rise,
          downColor: PRICE.fall,
          borderUpColor: PRICE.rise,
          borderDownColor: PRICE.fall,
          wickUpColor: PRICE.rise,
          wickDownColor: PRICE.fall,
          priceLineVisible: false,
          priceFormat: { type: "price", precision: 2, minMove: 0.01 },
        })
      }

      candleSeriesRef.current.setData(candleData)
    }

    chart.timeScale().fitContent()
  }, [mode, lineData, candleData, source.color])

  // ---------------------------------------------------------
  // Crosshair: lectura OHLC y tooltip
  // ---------------------------------------------------------
  useEffect(() => {
    const chart = chartRef.current
    const container = containerRef.current

    if (!chart || !container) return

    function handleMove(param: MouseEventParams<Time>) {
      const width = container?.clientWidth ?? 0
      const chartHeight = container?.clientHeight ?? 0

      if (
        !param.point ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > width ||
        param.point.y < 0 ||
        param.point.y > chartHeight
      ) {
        setTooltip((state) => (state.visible ? { ...state, visible: false } : state))
        setReadout(null)
        return
      }

      const series = mode === "line" ? lineSeriesRef.current : candleSeriesRef.current

      if (!series) return

      const data = param.seriesData.get(series)

      if (!data) {
        setTooltip((state) => (state.visible ? { ...state, visible: false } : state))
        setReadout(null)
        return
      }

      const time = param.time as number

      if (mode === "line") {
        const line = data as LineData<Time>

        setReadout({ time, price: line.value })
      } else {
        const candle = data as CandlestickData<Time>

        const changePercent = candle.open
          ? ((candle.close - candle.open) / candle.open) * 100
          : 0

        setReadout({
          time,
          price: candle.close,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          changePercent,
        })
      }

      // El tooltip se mantiene dentro del contenedor.
      const tooltipWidth = 132
      const left = Math.min(
        Math.max(param.point.x - tooltipWidth / 2, 8),
        Math.max(width - tooltipWidth - 8, 8),
      )

      setTooltip({
        left,
        top: Math.max(param.point.y - 64, 8),
        visible: true,
      })
    }

    chart.subscribeCrosshairMove(handleMove)

    return () => {
      chart.unsubscribeCrosshairMove(handleMove)
    }
  }, [mode])

  // ---------------------------------------------------------
  // Reset de zoom pedido desde los controles
  // ---------------------------------------------------------
  useEffect(() => {
    if (resetSignal > 0) {
      chartRef.current?.timeScale().fitContent()
    }
  }, [resetSignal])

  // ---------------------------------------------------------
  // Al salir con el dedo/ratón, se limpia la lectura
  // ---------------------------------------------------------
  const clearReadout = useCallback(() => {
    setReadout(null)
    setTooltip((state) => ({ ...state, visible: false }))
  }, [])

  const isUp = (readout?.changePercent ?? 0) >= 0

  return (
    <div className="relative">
      {/* Lectura OHLC sobre el gráfico. */}
      <div className="flex min-h-[1.5rem] flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] tabular-nums">
        {readout && mode === "candles" ? (
          <>
            <span className="text-ink-faint">
              O <span className="font-semibold text-ink-soft">{formatBs(readout.open ?? 0)}</span>
            </span>
            <span className="text-ink-faint">
              H <span className="font-semibold text-ink-soft">{formatBs(readout.high ?? 0)}</span>
            </span>
            <span className="text-ink-faint">
              L <span className="font-semibold text-ink-soft">{formatBs(readout.low ?? 0)}</span>
            </span>
            <span className="text-ink-faint">
              C <span className="font-semibold text-ink-soft">{formatBs(readout.close ?? 0)}</span>
            </span>
            <span
              className="font-semibold"
              style={{ color: isUp ? PRICE.rise : PRICE.fall }}
            >
              {isUp ? "+" : "−"}
              {Math.abs(readout.changePercent ?? 0).toFixed(2)}%
            </span>
          </>
        ) : readout ? (
          <>
            <span className="font-semibold text-ink-soft">Bs {formatBs(readout.price)}</span>
            <span className="text-ink-faint">{formatReadoutTime(readout.time, interval)}</span>
          </>
        ) : (
          <span className="text-ink-faint">
            {mode === "candles"
              ? "Toca una vela para ver su apertura, máximo, mínimo y cierre"
              : "Toca la gráfica para ver el precio en cada momento"}
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative mt-1 w-full touch-pan-y"
        style={{ height }}
        onMouseLeave={clearReadout}
        onTouchEnd={clearReadout}
      />

      {/* Tooltip flotante. */}
      {tooltip.visible && readout && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-hair bg-surface/95 px-2.5 py-1.5 text-[11px] shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm"
          style={{ left: tooltip.left, top: tooltip.top + 32 }}
        >
          {mode === "line" ? (
            <>
              <p className="font-semibold tabular-nums" style={{ color: source.color }}>
                Bs {formatBs(readout.price)}
              </p>
              <p className="mt-0.5 whitespace-nowrap text-ink-muted">
                {formatReadoutTime(readout.time, interval)}
              </p>
            </>
          ) : (
            <>
              <p className="whitespace-nowrap text-ink-muted">
                {formatReadoutTime(readout.time, interval)}
              </p>
              <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-2.5 gap-y-0.5 tabular-nums">
                <dt className="text-ink-faint">Apertura</dt>
                <dd className="text-right font-semibold text-ink-soft">
                  {formatBs(readout.open ?? 0)}
                </dd>
                <dt className="text-ink-faint">Máximo</dt>
                <dd className="text-right font-semibold text-ink-soft">
                  {formatBs(readout.high ?? 0)}
                </dd>
                <dt className="text-ink-faint">Mínimo</dt>
                <dd className="text-right font-semibold text-ink-soft">
                  {formatBs(readout.low ?? 0)}
                </dd>
                <dt className="text-ink-faint">Cierre</dt>
                <dd className="text-right font-semibold text-ink-soft">
                  {formatBs(readout.close ?? 0)}
                </dd>
              </dl>
              <p
                className="mt-1 text-right font-semibold tabular-nums"
                style={{ color: isUp ? PRICE.rise : PRICE.fall }}
              >
                {isUp ? "+" : "−"}
                {Math.abs(readout.changePercent ?? 0).toFixed(2)}%
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
