import { useEffect, useMemo, useRef, useState } from "react"
import {
  Line,
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
  P2PMarketStatusResponse,
  P2PSideSelection,
  P2PViewMode,
} from "../types/prices"
import { ChartCandlestick, ChartLine, Clock } from "lucide-react"

import { formatBs } from "../utils/format"
import { getStoredViewMode, setStoredViewMode } from "../utils/viewMode"
import { getStoredP2PSide, setStoredP2PSide } from "../utils/p2pPreferences"
import MarketPriceHeader from "../components/p2pMarket/MarketPriceHeader"
import MarketStatsDisclosure from "../components/p2pMarket/MarketStatsGrid"
import ViewModeToggle from "../components/p2pMarket/ViewModeToggle"
import MarketAiSheets from "../components/p2pMarket/MarketAiSheets"
import { useP2PAiAnalysis } from "../components/p2pMarket/useP2PAiAnalysis"
import { useP2PMarketStatus } from "../components/p2pMarket/useP2PMarketStatus"
import { COLORS, PRICE, priceChangeColor } from "../components/priceHistory/theme"
import { useCrossfade } from "../motion/useCrossfade"
import { useEnterOnChange } from "../motion/useEnterOnChange"
import { AnalyzeCta, ChartCard } from "../components/ui/ChartCard"
import { ChipScroller, Disclosure, IconButton, MetricCell, MetricGrid, Notice } from "../components/ui/primitives"
import { formatSignedPercent, toneOf } from "../components/ui/tone"
import AppShell from "../components/shell/AppShell"
import AppHeader from "../components/shell/AppHeader"
import { VcIcon } from "../components/ui/VcIcon"
import UsdtAnalyzerPro from "./usdtAnalyzerPro"

const RANGE_OPTIONS: { key: P2PHistoryRange; label: string }[] = [
  { key: "24h", label: "Día" },
  { key: "7d", label: "Semana" },
  { key: "30d", label: "Mes" },
  { key: "90d", label: "3 meses" },
  { key: "all", label: "Todo" },
]

// Convención estándar: vela que sube verde, que baja roja (ver PRICE).
const UP_COLOR = PRICE.rise
const DOWN_COLOR = PRICE.fall

/** Serie clásica de la vista Simple: SELL al notional de referencia. */
const SIMPLE_SIDE = "SELL"
const SIMPLE_NOTIONAL = 500

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

/** Eje Y: precio entero con separador de miles venezolano ("1.002"). */
function formatAxisPrice(value: number) {
  return new Intl.NumberFormat("es-VE", { maximumFractionDigits: 0 }).format(value)
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
    <div className="rounded-xl border border-hair bg-surface px-3 py-2 text-xs shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
      <p className="text-ink-muted">{formatTooltipDate(point.at, interval)}</p>
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
        <p className="text-ink-faint">Apertura <span className="font-semibold text-ink-soft">Bs {formatBs(point.open)}</span></p>
        <p className="text-ink-faint">Cierre <span className={`font-semibold ${isUp ? "text-rise" : "text-fall"}`}>Bs {formatBs(point.close)}</span></p>
        <p className="text-ink-faint">Máximo <span className="font-semibold text-rise">Bs {formatBs(point.high)}</span></p>
        <p className="text-ink-faint">Mínimo <span className="font-semibold text-fall">Bs {formatBs(point.low)}</span></p>
      </div>
      <p className="mt-1 text-[10px] text-ink-faint">{point.samples} muestras</p>
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
      <div className="rounded-xl border border-hair bg-surface px-3 py-2 text-xs shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
        <p className="text-ink-muted">{point.label} VE</p>
        <p className="mt-1 text-ink-faint">Sin datos en este rango</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-hair bg-surface px-3 py-2 text-xs shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
      <p className="text-ink-muted">{point.label} VE</p>
      <p className="mt-1 font-semibold text-up">
        Mediana: Bs {formatBs(point.medianPrice)}
      </p>
      <p className="mt-0.5 text-ink-faint">
        {point.samples} {point.samples === 1 ? "muestra" : "muestras"}
      </p>
    </div>
  )
}

/**
 * Mercado USDT/VES.
 *
 * La página es dueña de lo que comparten las dos vistas (cabecera,
 * precio, selector Simple/Profesional y el snapshot del mercado), así que
 * cambiar de vista ya no desmonta la pantalla entera: solo cambia el
 * cuerpo, que entra en cascada. Jerarquía: precio → vista → controles →
 * GRÁFICO → métricas y el resto.
 */
export default function UsdtAnalyzerPage() {
  const [viewMode, setViewMode] = useState<P2PViewMode>(() => getStoredViewMode())
  // Lado de la Vista Profesional; la Simple es siempre SELL.
  const [proSide, setProSide] = useState<P2PSideSelection>(() => getStoredP2PSide())

  const side: P2PSideSelection = viewMode === "pro" ? proSide : SIMPLE_SIDE
  const { snapshot, loading, error } = useP2PMarketStatus(side)

  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEnterOnChange(bodyRef, viewMode)

  function handleViewModeChange(mode: P2PViewMode) {
    setViewMode(mode)
    setStoredViewMode(mode)
  }

  function handleSideChange(next: P2PSideSelection) {
    setProSide(next)
    setStoredP2PSide(next)
  }

  return (
    <AppShell width={viewMode === "pro" ? "wide" : "app"}>
      <AppHeader
        variant="tab"
        icon={<VcIcon name="market-candles" className="h-[18px] w-[18px]" />}
        accent="#1FBF9F"
        title="USDT / VES"
        subtitle="Mercado P2P · Binance"
        // Simple/Pro vive en la cabecera: ahorra una fila entera sobre el
        // gráfico sin quitar ninguna de las dos vistas.
        actions={<ViewModeToggle compact value={viewMode} onChange={handleViewModeChange} className="w-[136px]" />}
      />

      <div className="space-y-3">
        <div data-enter>
          <MarketPriceHeader snapshot={snapshot} loading={loading} side={side === "BOTH" ? "SELL" : side} />
        </div>

        <div ref={bodyRef}>
          {viewMode === "pro" ? (
            <UsdtAnalyzerPro
              snapshot={snapshot}
              snapshotLoading={loading}
              snapshotError={error}
              side={proSide}
              onSideChange={handleSideChange}
            />
          ) : (
            <UsdtAnalyzerSimple snapshot={snapshot} />
          )}
        </div>
      </div>
    </AppShell>
  )
}

function UsdtAnalyzerSimple({ snapshot }: { snapshot: P2PMarketStatusResponse | null }) {
  const [range, setRange] = useState<P2PHistoryRange>("7d")
  const [chartMode, setChartMode] = useState<"candles" | "line">("candles")
  const [candles, setCandles] = useState<P2PCandle[]>([])
  const [bestHours, setBestHours] = useState<BestHoursResponse | null>(null)
  const [summary, setSummary] = useState<P2PHistorySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [usingCache, setUsingCache] = useState(false)

  const ai = useP2PAiAnalysis(SIMPLE_SIDE, SIMPLE_NOTIONAL)
  const chartRef = useRef<HTMLDivElement | null>(null)

  // Otro rango: transición breve del gráfico, no de toda la pantalla.
  useCrossfade(chartRef, range)

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

  const hasEnoughHourData = rankedHours.length >= 2

  const changePercent = summary?.change_percent ?? null

  return (
    <>
      <div className="space-y-3">
        <div data-enter>
          <ChartCard>
            <div className="flex items-center gap-2">
              <ChipScroller options={RANGE_OPTIONS} value={range} onChange={setRange} label="Rango" className="min-w-0 flex-1" />
              <IconButton
                label={chartMode === "candles" ? "Cambiar a línea" : "Cambiar a velas"}
                onClick={() => setChartMode((mode) => (mode === "candles" ? "line" : "candles"))}
              >
                {chartMode === "candles" ? (
                  <ChartCandlestick className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                ) : (
                  <ChartLine className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                )}
              </IconButton>
            </div>

            <div ref={chartRef} className="mt-2">
              {loading ? (
                <div className="flex h-60 items-center justify-center">
                  <p className="text-sm text-ink-muted">Cargando gráfica…</p>
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-60 flex-col items-center justify-center gap-2 px-4 text-center">
                  <p className="text-sm font-semibold text-ink-soft">Aún no hay datos suficientes</p>
                  <p className="text-[12px] text-ink-muted">
                    Todavía no se registraron capturas del mercado P2P en este rango.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="20%">
                    <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: COLORS.textMuted, fontSize: 11 }}
                      axisLine={{ stroke: COLORS.border }}
                      tickLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fill: COLORS.textMuted, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={["dataMin - 0.5", "dataMax + 0.5"]}
                      tickFormatter={formatAxisPrice}
                      width={52}
                    />
                    <Tooltip
                      content={<CustomCandleTooltip interval={chartInterval} />}
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    />
                    {chartMode === "candles" ? (
                      <Bar dataKey="range" shape={<CandleShape />} isAnimationActive={false} maxBarSize={22} />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="close"
                        stroke={priceChangeColor(changePercent, COLORS.textSoft)}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            <p className="mt-2 px-1 text-[11px] text-ink-faint">
              USDT/VES · SELL a 500 USDT ·{" "}
              {chartMode === "candles"
                ? chartInterval === "day"
                  ? "1 vela = 1 día"
                  : "1 vela = 1 hora"
                : `cierre por ${chartInterval === "day" ? "día" : "hora"}`}
            </p>

            {summary && (
              <MetricGrid columns={3} className="mt-2">
                <MetricCell
                  label="Cambio"
                  value={changePercent === null ? "—" : formatSignedPercent(changePercent)}
                  tone={toneOf(changePercent)}
                />
                <MetricCell
                  label={range === "all" ? "Máx hist." : "Máximo"}
                  value={formatBs(summary.highest_price)}
                  tone="up"
                />
                <MetricCell
                  label={range === "all" ? "Mín hist." : "Mínimo"}
                  value={formatBs(summary.lowest_price)}
                  tone="down"
                />
              </MetricGrid>
            )}
          </ChartCard>
        </div>

        {usingCache && <Notice>Mostrando datos guardados</Notice>}
        {error && <p className="break-words px-1 text-[12px] text-down">{error}</p>}

        <div data-enter>
          <MarketStatsDisclosure snapshot={snapshot} />
        </div>

        {ai.aiAvailable && (
          <div data-enter>
            <AnalyzeCta subtitle="Interpretación del estado actual del mercado" onClick={ai.openDrawer} />
          </div>
        )}

        <div data-enter>
          <Disclosure
            title="Mejor hora observada hoy"
            subtitle={
              bestHour
                ? `${bestHour.label}–${bestHour.hourEnd} · Bs ${formatBs(bestHour.medianPrice)}`
                : "Mediana por franja horaria (hora de Venezuela)"
            }
            icon={<Clock className="h-[18px] w-[18px] shrink-0 text-up" aria-hidden />}
          >
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-ink-muted">Calculando...</p>
              </div>
            ) : !hasEnoughHourData ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 px-4 text-center">
                <p className="text-sm font-medium text-ink-soft">Aún no hay patrón suficiente</p>
                <p className="text-xs text-ink-muted">
                  Prueba con un rango más amplio (semana o mes) para detectar la mejor hora.
                </p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={hourStats} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: COLORS.textMuted, fontSize: 11 }}
                      axisLine={{ stroke: COLORS.border }}
                      tickLine={false}
                      interval={3}
                    />
                    <YAxis
                      tick={{ fill: COLORS.textMuted, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={["dataMin - 0.5", "dataMax + 0.5"]}
                      tickFormatter={formatAxisPrice}
                      width={52}
                    />
                    <Tooltip content={<CustomHourTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="medianPrice" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      {hourStats.map((stat) => (
                        <Cell
                          key={stat.hour}
                          fill={
                            stat.samples === 0
                              ? COLORS.surfaceSoft
                              : topHourKeys.has(stat.hour)
                                ? COLORS.up
                                : "#2B3A52"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {bestHour && (
                  <div className="mt-3 rounded-tile border border-up/25 bg-up/10 px-3.5 py-3">
                    {/* Observación, no recomendación: describe lo que ya
                        pasó hoy y nunca a qué hora conviene operar. */}
                    <p className="text-[12px] leading-relaxed text-up">
                      Hasta ahora, la franja con el precio de venta más alto observada hoy fue entre las{" "}
                      <span className="font-semibold">
                        {bestHour.label} y {bestHour.hourEnd}
                      </span>{" "}
                      hora de Venezuela, con una mediana de{" "}
                      <span className="font-semibold">Bs {formatBs(bestHour.medianPrice)}</span> ({bestHour.samples}{" "}
                      {bestHour.samples === 1 ? "lectura" : "lecturas"}).
                    </p>
                  </div>
                )}
              </>
            )}
          </Disclosure>
        </div>
      </div>

      <MarketAiSheets ai={ai} />
    </>
  )
}
