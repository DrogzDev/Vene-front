import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { getPriceHistoryChart } from "../services/pricesApi"
import type {
  PriceChartGranularity,
  PriceChartPoint,
  PriceChartRange,
  PriceHistoryChartResponse,
} from "../types/prices"
import { formatBs, formatPercent } from "../utils/format"

type MetricKey = "average_price" | "bcv" | "binance_best_price"

type ChartPoint = PriceChartPoint & { label: string }

const RANGE_OPTIONS: { key: PriceChartRange; label: string }[] = [
  { key: "24h", label: "Día" },
  { key: "7d", label: "Semana" },
  { key: "30d", label: "Mes" },
]

const METRIC_OPTIONS: { key: MetricKey; label: string; color: string }[] = [
  { key: "average_price", label: "Promedio", color: "#c084fc" },
  { key: "bcv", label: "BCV", color: "#38bdf8" },
  { key: "binance_best_price", label: "USDT", color: "#a3e635" },
]

function formatAxisLabel(point: PriceChartPoint, granularity: PriceChartGranularity) {
  const date = new Date(point.at)

  if (granularity === "snapshot") {
    return format(date, "HH:mm")
  }

  return format(date, "dd/MM")
}

function formatTooltipDate(point: PriceChartPoint, granularity: PriceChartGranularity) {
  const date = new Date(point.at)

  if (granularity === "snapshot") {
    return format(date, "EEEE d 'de' MMMM, HH:mm", { locale: es })
  }

  return format(date, "EEEE d 'de' MMMM", { locale: es })
}

function CustomTooltip({
  active,
  payload,
  granularity,
  metric,
}: {
  active?: boolean
  payload?: { payload: ChartPoint }[]
  granularity: PriceChartGranularity
  metric: (typeof METRIC_OPTIONS)[number]
}) {
  if (!active || !payload || payload.length === 0) return null

  const point = payload[0].payload

  return (
    <div className="rounded-xl border border-[#2a2f38] bg-[#171a21] px-3 py-2 text-xs shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
      <p className="text-[#8b92a0]">{formatTooltipDate(point, granularity)}</p>
      <p className="mt-1 font-semibold" style={{ color: metric.color }}>
        Bs {formatBs(point[metric.key])}
      </p>
    </div>
  )
}

export default function PriceChartPage() {
  const navigate = useNavigate()

  const [range, setRange] = useState<PriceChartRange>("24h")
  const [metric, setMetric] = useState<MetricKey>("average_price")
  const [chart, setChart] = useState<PriceHistoryChartResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [usingCache, setUsingCache] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setError("")
        setLoading(true)

        const result = await getPriceHistoryChart(range)

        if (cancelled) return

        setChart(result.data)
        setUsingCache(result.fromCache)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Error cargando la gráfica")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [range])

  const activeMetric = METRIC_OPTIONS.find((option) => option.key === metric) ?? METRIC_OPTIONS[0]

  const points = chart?.data ?? []
  const granularity = chart?.granularity ?? "snapshot"
  const summary = chart?.summary ?? null

  const chartData = useMemo<ChartPoint[]>(() => {
    return points.map((point) => ({
      ...point,
      label: formatAxisLabel(point, granularity),
    }))
  }, [points, granularity])

  const changeIsPositive = (summary?.change ?? 0) >= 0
  const showDots = chartData.length > 0 && chartData.length <= 20

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-[#e7e9ee]">Historial de precios</h1>
            <p className="truncate text-xs text-[#7f8694]">Fluctuación del dólar y USDT</p>
          </div>
        </header>

        <div className="mt-6 flex gap-2 rounded-2xl border border-[#27313d] bg-[#151b23] p-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setRange(option.key)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                range === option.key
                  ? "bg-[#e7e9ee] text-[#0f1116]"
                  : "text-[#8b92a0] hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {METRIC_OPTIONS.map((option) => {
            const isActive = option.key === metric

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setMetric(option.key)}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition"
                style={{
                  borderColor: isActive ? option.color : "#2a2f38",
                  backgroundColor: isActive ? `${option.color}1f` : "#171a21",
                  color: isActive ? option.color : "#8b92a0",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
                {option.label}
              </button>
            )
          })}
        </div>

        {usingCache && (
          <div className="mt-4 break-words rounded-2xl border border-[#3a3340] bg-[#1a1820] px-4 py-3 text-xs text-[#c9b7d9]">
            Mostrando datos guardados
          </div>
        )}

        {error && (
          <p className="mt-3 break-words text-xs text-red-400">{error}</p>
        )}

        {summary && (
          <div className="mt-4 rounded-2xl border border-[#27313d] bg-gradient-to-br from-[#161c24] to-[#10161d] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-2xl font-bold text-[#e7e9ee]">
                Bs {formatBs(summary.close ?? 0)}
              </p>

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
                <p className="text-[#7f8694]">Apertura</p>
                <p className="mt-0.5 font-semibold text-[#d7dbe3]">
                  Bs {formatBs(summary.open ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-[#7f8694]">Cierre</p>
                <p className="mt-0.5 font-semibold text-[#d7dbe3]">
                  Bs {formatBs(summary.close ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-[#7f8694]">Máximo</p>
                <p className="mt-0.5 font-semibold text-lime-400">
                  Bs {formatBs(summary.high ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-[#7f8694]">Mínimo</p>
                <p className="mt-0.5 font-semibold text-red-400">
                  Bs {formatBs(summary.low ?? 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-[#27313d] bg-[#10161d] p-3">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-[#8b92a0]">Cargando gráfica...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-sm font-medium text-[#d7dbe3]">
                Aún no hay datos suficientes
              </p>
              <p className="text-xs text-[#7f8694]">
                {range === "24h"
                  ? "Todavía no se registraron actualizaciones de precio hoy."
                  : "No hay cierres diarios guardados para este rango."}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
                  content={<CustomTooltip granularity={granularity} metric={activeMetric} />}
                  cursor={{ stroke: "#2a2f38", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey={activeMetric.key}
                  stroke={activeMetric.color}
                  strokeWidth={2.5}
                  dot={showDots ? { r: 3, fill: activeMetric.color, strokeWidth: 0 } : false}
                  activeDot={{ r: 5, fill: activeMetric.color, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </main>
  )
}
