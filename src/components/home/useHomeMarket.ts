import { useEffect, useMemo, useState } from "react"

import { onAppResume } from "../../services/appLifecycle"
import {
  getDailyCloseHistory,
  getHomePrices,
  peekDailyCloseHistory,
  peekHomePrices,
  refreshHomePrices,
} from "../../services/pricesApi"
import type { DailyCloseHistoryItem, PricesHomeData } from "../../types/prices"

/** Puntos de la línea de tendencia de cada fila. */
const TREND_POINTS = 7

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Fecha de hoy en el calendario de Venezuela, como "YYYY-MM-DD". */
function venezuelaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
  }).format(new Date())
}

/** Variación entre el último valor de la serie y el anterior. */
function changeFromSeries(series: number[]): number | null {
  if (series.length < 2) return null

  const previous = series[series.length - 2]
  const current = series[series.length - 1]

  if (!Number.isFinite(previous) || previous <= 0 || !Number.isFinite(current)) return null

  return ((current - previous) / previous) * 100
}

/**
 * Datos de mercado de Inicio: tasas en vivo, cierres diarios, vista de
 * una fecha histórica y las series/variaciones que se derivan de ellos.
 *
 * Pinta al instante lo último conocido (memoria de la sesión o
 * localStorage) y revalida por detrás: sin spinner si ya hay datos. Lo
 * que se muestra desde caché lleva su propia hora del servidor
 * (updated_at), así que nunca se presenta como recién actualizado.
 * "Guardado" (usingCache) se reserva para cuando la red FALLÓ.
 *
 * Se revalida también al volver a la app o al recuperar la conexión.
 */
export function useHomeMarket() {
  const [initial] = useState(() => peekHomePrices())
  const [data, setData] = useState<PricesHomeData | null>(initial?.data ?? null)
  const [loading, setLoading] = useState(!initial)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [usingCache, setUsingCache] = useState(false)
  const [cachedAt, setCachedAt] = useState<string | null>(null)

  const [history, setHistory] = useState<DailyCloseHistoryItem[]>(() => peekDailyCloseHistory() ?? [])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [historicalItem, setHistoricalItem] = useState<DailyCloseHistoryItem | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState("")

  async function loadData() {
    try {
      setError("")
      // Con datos en pantalla la revalidación es silenciosa.
      setLoading((current) => current && !data)

      const homeResult = await getHomePrices()

      setData(homeResult.data)
      setUsingCache(homeResult.fromCache)
      setCachedAt(homeResult.cachedAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos")
    } finally {
      setLoading(false)
    }
  }

  async function loadHistory() {
    try {
      const historyResult = await getDailyCloseHistory()
      setHistory(historyResult.data)
    } catch (err) {
      console.error("Error cargando historial:", err)
    }
  }

  async function refresh() {
    try {
      setError("")
      setRefreshing(true)

      const homeResult = await refreshHomePrices()

      setData(homeResult.data)
      setUsingCache(false)
      setCachedAt(null)

      const historyResult = await getDailyCloseHistory()
      setHistory(historyResult.data)

      if (selectedDate) {
        const dateKey = toDateKey(selectedDate)
        const match = historyResult.data.find((item) => item.date === dateKey) || null

        setHistoricalItem(match)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando datos")
    } finally {
      setRefreshing(false)
    }
  }

  function selectHistoricalDate(date: Date | null) {
    setSelectedDate(date)
    setHistoryError("")

    if (!date) {
      setHistoricalItem(null)
      return
    }

    const dateKey = toDateKey(date)
    const match = history.find((item) => item.date === dateKey) || null

    if (!match) {
      setHistoricalItem(null)
      setHistoryError("No hay datos históricos guardados para esa fecha.")
      return
    }

    setHistoricalItem(match)
  }

  function clearHistoricalView() {
    setSelectedDate(null)
    setHistoricalItem(null)
    setHistoryError("")
  }

  useEffect(() => {
    async function init() {
      setHistoryLoading(true)

      try {
        await Promise.all([loadData(), loadHistory()])
      } finally {
        setHistoryLoading(false)
      }
    }

    init()

    // Al volver a la app o recuperar la red: revalidar sin spinner. La
    // caché de pricesApi evita repetir un pedido de hace segundos.
    return onAppResume(() => {
      loadData()
      loadHistory()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const availableDates = useMemo(() => history.map((item) => item.date), [history])

  const displayData = useMemo(() => {
    if (!data) return null

    if (!historicalItem) return data

    return {
      ...data,
      bcv: {
        ...data.bcv,
        USD: historicalItem.bcv,
        // El euro de ESE cierre; si no se guardó, hueco (se pinta "—").
        EUR: historicalItem.eur_bcv ?? Number.NaN,
      },
      binance_best_price: historicalItem.binance_best_price,
      average_price: historicalItem.average_price,
      spread: {
        absolute: historicalItem.spread_absolute,
        percent: historicalItem.spread_percent,
      },
      updated_at: historicalItem.created_at || historicalItem.date,
    }
  }, [data, historicalItem])

  /**
   * Series reales de cierre para las líneas de tendencia y la variación.
   *
   * La variación compara el valor mostrado con el cierre anterior
   * guardado en DailyClose. El euro usa `eur_bcv` de esos mismos
   * cierres; un cierre sin euro queda como hueco (NaN), no se rellena.
   */
  const series = useMemo(() => {
    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))

    if (historicalItem) {
      const index = sorted.findIndex((item) => item.date === historicalItem.date)
      const upTo = index >= 0 ? sorted.slice(0, index + 1) : sorted

      return {
        dates: upTo.map((item) => item.date),
        bcv: upTo.map((item) => item.bcv),
        eur: upTo.map((item) => item.eur_bcv ?? Number.NaN),
        usdt: upTo.map((item) => item.binance_best_price),
        average: upTo.map((item) => item.average_price),
      }
    }

    if (!data) {
      return { dates: [] as string[], bcv: [], eur: [], usdt: [], average: [] }
    }

    // El cierre de HOY se descarta antes de añadir el precio en vivo: el
    // backend reescribe el DailyClose del día con el último precio, y
    // dejarlo dentro comparaba el precio actual consigo mismo.
    const today = venezuelaToday()
    const previousDays = sorted.filter((item) => item.date !== today)

    return {
      // Fecha de cada valor (YYYY-MM-DD, calendario de Venezuela): el
      // último es el precio en vivo de hoy.
      dates: [...previousDays.map((item) => item.date), today],
      bcv: [...previousDays.map((item) => item.bcv), data.bcv.USD],
      eur: [...previousDays.map((item) => item.eur_bcv ?? Number.NaN), data.bcv.EUR],
      usdt: [...previousDays.map((item) => item.binance_best_price), data.binance_best_price],
      average: [...previousDays.map((item) => item.average_price), data.average_price],
    }
  }, [history, historicalItem, data])

  const changes = useMemo(
    () => ({
      bcv: changeFromSeries(series.bcv),
      eur: changeFromSeries(series.eur),
      usdt: changeFromSeries(series.usdt),
      average: changeFromSeries(series.average),
    }),
    [series],
  )

  const trends = useMemo(
    () => ({
      bcv: series.bcv.slice(-TREND_POINTS),
      eur: series.eur.slice(-TREND_POINTS),
      usdt: series.usdt.slice(-TREND_POINTS),
      average: series.average.slice(-TREND_POINTS),
    }),
    [series],
  )

  return {
    data,
    displayData,
    loading,
    refreshing,
    error,
    usingCache,
    cachedAt,
    availableDates,
    selectedDate,
    historicalItem,
    historyLoading,
    historyError,
    changes,
    trends,
    series,
    loadData,
    refresh,
    selectHistoricalDate,
    clearHistoricalView,
  }
}

export type HomeMarket = ReturnType<typeof useHomeMarket>
