import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  BarChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { format } from "date-fns"

import {
  getBestHours,
  getP2PHistory,
  getP2PHistorySummary,
} from "../services/pricesApi"
import type {
  BestHoursResponse,
  P2PCandle,
  P2PCandleInterval,
  P2PHistoryRange,
  P2PHistorySummary,
  P2PViewMode,
} from "../types/prices"
import { formatBs, formatPercent } from "../utils/format"
import { getStoredViewMode, setStoredViewMode } from "../utils/viewMode"
import ViewModeToggle from "../components/p2pMarket/ViewModeToggle"
import { ChevronLeftIcon } from "../components/priceHistory/icons"
import UsdtAnalyzerPro from "./usdtAnalyzerPro"

const RANGE_OPTIONS: { key: P2PHistoryRange; label: string }[] = [
  { key: "24h", label: "Día" },
  { key: "7d", label: "Semana" },
  { key: "30d", label: "Mes" },
  { key: "90d", label: "3 meses" },
  { key: "all", label: "Todo" },
]

const UP_COLOR = "#22c55e"
const DOWN_COLOR = "#ef4444"

type ChartPoint = P2PCandle & {
  label: string
  range: [number, number]
}

/**
 * Franja horaria tal y como la calcula Django.
 *
 * Antes esta vista agrupaba las horas por su cuenta en el navegador,
 * con media y con su propio umbral, así que podía contradecir a la
 * Vista Profesional. Ahora las dos leen el mismo cálculo, que usa
 * MEDIANA para que un anuncio atípico no corone una hora que en
 * realidad nunca estuvo disponible.
 */
type HourStat = {
  hour: number
  label: string
  medianPrice: number
  samples: number
}

function chartIntervalForRange(range: P2PHistoryRange): P2PCandleInterval {
  return range === "90d" || range === "all" ? "day" : "hour"
}

function formatHourLabel(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`
}

function formatAxisLabel(candle: P2PCandle, interval: P2PCandleInterval, range: P2PHistoryRange) {
  const date = new Date(candle.at)

  if (interval === "day") return format(date, "dd/MM")
  if (range === "24h") return format(date, "HH:mm")
  return format(date, "dd/MM HH:mm")
}

function formatTooltipDate(iso: string, interval: P2PCandleInterval) {
  return format(new Date(iso), interval === "day" ? "dd/MM/yyyy" : "dd/MM HH:mm")
}

type CandleShapeProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: ChartPoint
}

function CandleShape({ x = 0, y = 0, width = 0, height = 0, payload }: CandleShapeProps) {
  if (!payload) return null

  const { open, close, high, low } = payload
  const isUp = close >= open
  const color = isUp ? UP_COLOR : DOWN_COLOR

  if (high === low || height <= 0) {
    return <line x1={x + width / 2} x2={x + width / 2} y1={y} y2={y + Math.max(height, 1)} stroke={color} strokeWidth={1.5} />
  }

  const ratio = height / (high - low)
  const bodyTop = y + (high - Math.max(open, close)) * ratio
  const bodyBottom = y + (high - Math.min(open, close)) * ratio
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1)
  const wickX = x + width / 2
  const bodyWidth = Math.max(width * 0.6, 2)
  const bodyX = x + (width - bodyWidth) / 2

  return (
    <g>
      <line x1={wickX} x2={wickX} y1={y} y2={y + height} stroke={color} strokeWidth={1.5} />
      <rect x={bodyX} y={bodyTop} width={bodyWidth} height={bodyHeight} fill={color} />
    </g>
  )
}

function CustomCandleTooltip({
  active,
  payload,
  interval,
}: {
  active?: boolean
  payload?: { payload: ChartPoint }[]
  interval: P2PCandleInterval
}) {
  if (!active || !payload || payload.length === 0) return null

  const point = payload[0].payload
  const isUp = point.close >= point.open

  return (
    <div className="rounded-xl border border-[#2a2f38] bg-[#171a21] px-3 py-2 text-xs shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
      <p className="text-[#8b92a0]">{formatTooltipDate(point.at, interval)}</p>
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
        <p className="text-[#7f8694]">Apertura <span className="font-semibold text-[#d7dbe3]">Bs {formatBs(point.open)}</span></p>
        <p className="text-[#7f8694]">Cierre <span className={`font-semibold ${isUp ? "text-lime-400" : "text-red-400"}`}>Bs {formatBs(point.close)}</span></p>
        <p className="text-[#7f8694]">Máximo <span className="font-semibold text-lime-400">Bs {formatBs(point.high)}</span></p>
        <p className="text-[#7f8694]">Mínimo <span className="font-semibold text-red-400">Bs {formatBs(point.low)}</span></p>
      </div>
      <p className="mt-1 text-[10px] text-[#7f8694]">{point.samples} muestras</p>
    </div>
  )
}

function CustomHourTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: HourStat }[]
}) {
  if (!active || !payload || payload.length === 0) return null

  const point = payload[0].payload

  if (point.samples === 0) {
    return (
      <div className="rounded-xl border border-[#2a2f38] bg-[#171a21] px-3 py-2 text-xs shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
        <p className="text-[#8b92a0]">{point.label} VE</p>
        <p className="mt-1 text-[#7f8694]">Sin datos en este rango</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#2a2f38] bg-[#171a21] px-3 py-2 text-xs shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
      <p className="text-[#8b92a0]">{point.label} VE</p>
      <p className="mt-1 font-semibold text-lime-400">
        Mediana: Bs {formatBs(point.medianPrice)}
      </p>
      <p className="mt-0.5 text-[#7f8694]">
        {point.samples} {point.samples === 1 ? "muestra" : "muestras"}
      </p>
    </div>
  )
}

export default function UsdtAnalyzerPage() {
  const navigate = useNavigate()

  const [viewMode, setViewMode] = useState<P2PViewMode>(() => getStoredViewMode())

  function handleViewModeChange(mode: P2PViewMode) {
    setViewMode(mode)
    setStoredViewMode(mode)
  }

  if (viewMode === "pro") {
    return (
      <UsdtAnalyzerPro
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onBack={() => navigate("/")}
      />
    )
  }

  return (
    <UsdtAnalyzerSimple viewMode={viewMode} onViewModeChange={handleViewModeChange} />
  )
}

function UsdtAnalyzerSimple({
  viewMode,
  onViewModeChange,
}: {
  viewMode: P2PViewMode
  onViewModeChange: (mode: P2PViewMode) => void
}) {
  const navigate = useNavigate()

  const [range, setRange] = useState<P2PHistoryRange>("7d")
  const [candles, setCandles] = useState<P2PCandle[]>([])
  const [bestHours, setBestHours] = useState<BestHoursResponse | null>(null)
  const [summary, setSummary] = useState<P2PHistorySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [usingCache, setUsingCache] = useState(false)

  const chartInterval = chartIntervalForRange(range)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setError("")
        setLoading(true)

        const [chartResult, summaryResult, hoursResult] = await Promise.all([
          getP2PHistory(range, chartInterval),
          getP2PHistorySummary(range),
          // Las franjas horarias las calcula Django, no el navegador.
          // Si falla, el resto de la pantalla sigue funcionando.
          getBestHours({ side: "SELL" }).catch(() => null),
        ])

        if (cancelled) return

        setCandles(chartResult.data.data)
        setSummary(summaryResult.data.summary)
        setBestHours(hoursResult)
        setUsingCache(chartResult.fromCache || summaryResult.fromCache)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Error cargando el análisis")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [range, chartInterval])

  const chartData = useMemo<ChartPoint[]>(() => {
    return candles.map((candle) => ({
      ...candle,
      label: formatAxisLabel(candle, chartInterval, range),
      range: [candle.low, candle.high],
    }))
  }, [candles, chartInterval, range])

  const hourStats = useMemo<HourStat[]>(() => {
    const byHour = new Map(bestHours?.buckets.map((b) => [b.hour, b]) ?? [])

    return Array.from({ length: 24 }, (_, hour) => {
      const bucket = byHour.get(hour)

      return {
        hour,
        label: formatHourLabel(hour),
        medianPrice: bucket?.median_price ?? 0,
        samples: bucket?.sample_count ?? 0,
      }
    })
  }, [bestHours])

  const rankedHours = useMemo(
    () => hourStats.filter((h) => h.samples > 0).sort((a, b) => b.medianPrice - a.medianPrice),
    [hourStats],
  )

  // La franja la elige Django, no el navegador: aquí solo se dibuja.
  const bestHour = useMemo(() => {
    const winner = bestHours?.best_sell_hour

    if (!winner) return null

    return {
      hour: winner.hour,
      label: winner.hour_start,
      hourEnd: winner.hour_end,
      medianPrice: winner.median_price,
      samples: winner.sample_count,
    }
  }, [bestHours])

  const topHourKeys = useMemo(
    () => new Set(rankedHours.slice(0, 3).map((h) => h.hour)),
    [rankedHours],
  )

  const changeIsPositive = (summary?.change ?? 0) >= 0
  const hasEnoughHourData = rankedHours.length >= 2

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,#111218_0%,#15171d_100%)] text-[#e7e9ee]">
      <div className="mx-auto w-full max-w-sm px-4 py-6">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#2a2f38] bg-[#171a21]/90 text-[#d7dbe3] transition hover:border-white/20 hover:bg-[#20252e] hover:text-white active:scale-95"
            aria-label="Volver"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-[#e7e9ee]">Análisis USDT P2P</h1>
            <p className="truncate text-xs text-[#7f8694]">
              Fluctuación de venta en Binance y mejor hora para vender
            </p>
          </div>
        </header>

        <div className="mt-4">
          <ViewModeToggle value={viewMode} onChange={onViewModeChange} className="w-full" />
        </div>

        <div className="mt-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-[#27313d] bg-[#151b23] p-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setRange(option.key)}
              className={`flex-1 shrink-0 rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                range === option.key
                  ? "bg-[#e7e9ee] text-[#0f1116]"
                  : "text-[#8b92a0] hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {usingCache && (
          <div className="mt-4 break-words rounded-2xl border border-[#3a3340] bg-[#1a1820] px-4 py-3 text-xs text-[#c9b7d9]">
            Mostrando datos guardados
          </div>
        )}

        {error && <p className="mt-3 break-words text-xs text-red-400">{error}</p>}

        {summary && (
          <div className="mt-4 rounded-2xl border border-[#27313d] bg-gradient-to-br from-[#161c24] to-[#10161d] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-2xl font-bold text-[#e7e9ee]">Bs {formatBs(summary.close)}</p>

              {summary.change_percent !== null && (
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    changeIsPositive ? "text-lime-400" : "text-red-400"
                  }`}
                >
                  {formatPercent(summary.change_percent)}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-[#7f8694]">
              {summary.samples} {summary.samples === 1 ? "muestra" : "muestras"} en este rango
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[#7f8694]">
                  {range === "all" ? "Máximo histórico" : "Precio más alto"}
                </p>
                <p className="mt-0.5 font-semibold text-lime-400">
                  Bs {formatBs(summary.highest_price)}
                </p>
                <p className="mt-0.5 text-[10px] text-[#7f8694]">
                  {format(new Date(summary.highest_price_at), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-[#7f8694]">
                  {range === "all" ? "Mínimo histórico" : "Precio más bajo"}
                </p>
                <p className="mt-0.5 font-semibold text-red-400">
                  Bs {formatBs(summary.lowest_price)}
                </p>
                <p className="mt-0.5 text-[10px] text-[#7f8694]">
                  {format(new Date(summary.lowest_price_at), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-[#27313d] bg-[#10161d] p-3">
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-xs font-semibold text-[#d7dbe3]">Velas de precio (SELL)</p>
            <span className="text-[10px] uppercase tracking-wide text-[#7f8694]">
              {chartInterval === "day" ? "1 vela = 1 día" : "1 vela = 1 hora"}
            </span>
          </div>

          {loading ? (
            <div className="flex h-56 items-center justify-center">
              <p className="text-sm text-[#8b92a0]">Cargando gráfica...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-sm font-medium text-[#d7dbe3]">Aún no hay datos suficientes</p>
              <p className="text-xs text-[#7f8694]">
                Todavía no se registraron capturas del mercado P2P en este rango.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid stroke="#1f2530" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#7f8694", fontSize: 10 }}
                  axisLine={{ stroke: "#27313d" }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: "#7f8694", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={["dataMin - 0.5", "dataMax + 0.5"]}
                  width={48}
                />
                <Tooltip
                  content={<CustomCandleTooltip interval={chartInterval} />}
                  cursor={{ fill: "#1f2530" }}
                />
                <Bar dataKey="range" shape={<CandleShape />} isAnimationActive={false} maxBarSize={22} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-[#27313d] bg-[#10161d] p-3">
          <p className="px-1 text-xs font-semibold text-[#d7dbe3]">
            Mejor hora observada hoy para vender
          </p>
          <p className="px-1 pb-2 text-[11px] text-[#7f8694]">
            Mediana por franja horaria (hora de Venezuela)
          </p>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-[#8b92a0]">Calculando...</p>
            </div>
          ) : !hasEnoughHourData ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-sm font-medium text-[#d7dbe3]">Aún no hay patrón suficiente</p>
              <p className="text-xs text-[#7f8694]">
                Prueba con un rango más amplio (semana o mes) para detectar la mejor hora.
              </p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={hourStats} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#1f2530" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#7f8694", fontSize: 9 }}
                    axisLine={{ stroke: "#27313d" }}
                    tickLine={false}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fill: "#7f8694", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    domain={["dataMin - 0.5", "dataMax + 0.5"]}
                    width={48}
                  />
                  <Tooltip content={<CustomHourTooltip />} cursor={{ fill: "#1f2530" }} />
                  <Bar dataKey="medianPrice" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {hourStats.map((stat) => (
                      <Cell
                        key={stat.hour}
                        fill={
                          stat.samples === 0
                            ? "#1c2129"
                            : topHourKeys.has(stat.hour)
                              ? "#a3e635"
                              : "#3a4655"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {bestHour && (
                <div className="mt-3 rounded-xl border border-[#3a4a2e] bg-[#1a2417] px-3 py-2.5">
                  {/* Observación, no recomendación: describe lo que ya
                      pasó hoy y nunca a qué hora conviene operar. */}
                  <p className="text-xs text-[#8fd147]">
                    Hasta ahora, la franja con el precio de venta más alto
                    observada hoy fue entre las{" "}
                    <span className="font-semibold">
                      {bestHour.label} y {bestHour.hourEnd}
                    </span>{" "}
                    hora de Venezuela, con una mediana de{" "}
                    <span className="font-semibold">Bs {formatBs(bestHour.medianPrice)}</span>{" "}
                    ({bestHour.samples} {bestHour.samples === 1 ? "lectura" : "lecturas"}).
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
