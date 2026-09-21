import type {
  PricesHomeResponse,
  PricesHomeData,
  DailyCloseHistoryResponse,
  DailyCloseHistoryItem,
  PriceChartRange,
  PriceSource,
  PriceHistoryChartResponse,
  MarketAnalysisResponse,
  MarketAnalysisStatusResponse,
  P2PHistoryRange,
  P2PCandleInterval,
  P2PHistoryResponse,
  P2PHistorySummaryResponse,
  P2PTimeframeKey,
  P2PHistoryChartResponse,
  P2PMarketStatusResponse,
  P2PAnalysisRange,
  P2PMarketAnalysisResponse,
  P2PSide,
  P2PSideSelection,
  P2PMarketCurrentResponse,
  P2PNotionalHistoryResponse,
} from "../types/prices"
import { getDeviceId } from "../utils/device"

const API_BASE = import.meta.env.VITE_API_URL
const HOME_PRICES_CACHE_KEY = "vex_home_prices_cache"
const DAILY_CLOSE_HISTORY_CACHE_KEY = "vex_daily_close_history_cache"

type CachedHomePrices = {
  data: PricesHomeData
  cachedAt: string
}

type CachedDailyCloseHistory = {
  data: DailyCloseHistoryItem[]
  cachedAt: string
}

function saveHomePricesToCache(data: PricesHomeData) {
  const payload: CachedHomePrices = {
    data,
    cachedAt: new Date().toISOString(),
  }

  localStorage.setItem(HOME_PRICES_CACHE_KEY, JSON.stringify(payload))
}

function saveDailyCloseHistoryToCache(data: DailyCloseHistoryItem[]) {
  const payload: CachedDailyCloseHistory = {
    data,
    cachedAt: new Date().toISOString(),
  }

  localStorage.setItem(DAILY_CLOSE_HISTORY_CACHE_KEY, JSON.stringify(payload))
}

export function getCachedHomePrices(): CachedHomePrices | null {
  const raw = localStorage.getItem(HOME_PRICES_CACHE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as CachedHomePrices
  } catch {
    localStorage.removeItem(HOME_PRICES_CACHE_KEY)
    return null
  }
}

export function getCachedDailyCloseHistory(): CachedDailyCloseHistory | null {
  const raw = localStorage.getItem(DAILY_CLOSE_HISTORY_CACHE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as CachedDailyCloseHistory
  } catch {
    localStorage.removeItem(DAILY_CLOSE_HISTORY_CACHE_KEY)
    return null
  }
}

export async function getHomePrices() {
  try {
    const response = await fetch(`${API_BASE}/prices/home/`)

    if (!response.ok) {
      throw new Error("No se pudo obtener la información del home")
    }

    const data: PricesHomeResponse = await response.json()

    if (!data.ok) {
      throw new Error("La API respondió con error")
    }

    saveHomePricesToCache(data.data)

    return {
      data: data.data,
      fromCache: false,
      cachedAt: null,
    }
  } catch (error) {
    const cached = getCachedHomePrices()

    if (cached) {
      return {
        data: cached.data,
        fromCache: true,
        cachedAt: cached.cachedAt,
      }
    }

    throw error
  }
}

export async function refreshHomePrices() {
  const response = await fetch(`${API_BASE}/prices/refresh/`, {
    method: "POST",
  })

  if (!response.ok) {
    throw new Error("No se pudieron actualizar los precios")
  }

  const data: PricesHomeResponse = await response.json()

  if (!data.ok) {
    throw new Error("Error actualizando precios")
  }

  saveHomePricesToCache(data.data)

  return {
    data: data.data,
    fromCache: false,
    cachedAt: null,
  }
}

export async function getDailyCloseHistory() {
  try {
    const response = await fetch(`${API_BASE}/prices/daily-close-history/`)

    if (!response.ok) {
      throw new Error("No se pudo obtener el historial diario")
    }

    const data: DailyCloseHistoryResponse = await response.json()

    if (!data.ok) {
      throw new Error("La API respondió con error en el historial diario")
    }

    saveDailyCloseHistoryToCache(data.data)

    return {
      data: data.data,
      fromCache: false,
      cachedAt: null,
    }
  } catch (error) {
    const cached = getCachedDailyCloseHistory()

    if (cached) {
      return {
        data: cached.data,
        fromCache: true,
        cachedAt: cached.cachedAt,
      }
    }

    throw error
  }
}

const PRICE_CHART_CACHE_KEY_PREFIX = "vex_price_chart_cache_"

type CachedPriceChart = {
  data: PriceHistoryChartResponse
  cachedAt: string
}

function priceChartCacheKey(range: PriceChartRange, source: PriceSource) {
  return `${PRICE_CHART_CACHE_KEY_PREFIX}${range}_${source}`
}

function savePriceChartToCache(
  range: PriceChartRange,
  source: PriceSource,
  data: PriceHistoryChartResponse,
) {
  const payload: CachedPriceChart = {
    data,
    cachedAt: new Date().toISOString(),
  }

  localStorage.setItem(priceChartCacheKey(range, source), JSON.stringify(payload))
}

function getCachedPriceChart(
  range: PriceChartRange,
  source: PriceSource,
): CachedPriceChart | null {
  const raw = localStorage.getItem(priceChartCacheKey(range, source))
  if (!raw) return null

  try {
    return JSON.parse(raw) as CachedPriceChart
  } catch {
    localStorage.removeItem(priceChartCacheKey(range, source))
    return null
  }
}

export async function getPriceHistoryChart(
  range: PriceChartRange,
  source: PriceSource = "average",
  options: { signal?: AbortSignal } = {},
) {
  try {
    const response = await fetch(
      `${API_BASE}/prices/history-chart/?range=${range}&source=${source}`,
      { signal: options.signal },
    )

    if (!response.ok) {
      throw new Error("No se pudo obtener la gráfica de precios")
    }

    const data: PriceHistoryChartResponse = await response.json()

    if (!data.ok) {
      throw new Error("La API respondió con error en la gráfica de precios")
    }

    savePriceChartToCache(range, source, data)

    return {
      data,
      fromCache: false,
      cachedAt: null,
    }
  } catch (error) {
    // Una petición cancelada no debe caer al caché ni mostrar error.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error
    }

    const cached = getCachedPriceChart(range, source)

    if (cached) {
      return {
        data: cached.data,
        fromCache: true,
        cachedAt: cached.cachedAt,
      }
    }

    throw error
  }
}

// =========================================================
// ANÁLISIS DE MERCADO CON IA
// =========================================================

/**
 * Error con el mensaje ya preparado por Django. Nunca contiene
 * trazas internas: el backend solo expone texto apto para el usuario.
 */
export class MarketAnalysisError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = "MarketAnalysisError"
    this.code = code
    this.status = status
  }
}

export async function getMarketAnalysisStatus(options: { signal?: AbortSignal } = {}) {
  const response = await fetch(`${API_BASE}/prices/analysis/status/`, {
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error("No se pudo consultar el estado del análisis")
  }

  const data: MarketAnalysisStatusResponse = await response.json()

  return data
}

export async function getMarketAnalysis(
  range: PriceChartRange,
  source: PriceSource,
  options: { refresh?: boolean; signal?: AbortSignal } = {},
) {
  const response = await fetch(`${API_BASE}/prices/analysis/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-ID": getDeviceId(),
    },
    // El cuerpo solo dice QUÉ analizar. Los precios los lee Django
    // de su propia base de datos.
    body: JSON.stringify({
      range,
      source,
      refresh: options.refresh ?? false,
    }),
    signal: options.signal,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.ok) {
    throw new MarketAnalysisError(
      data?.error ?? "No se pudo generar el análisis en este momento.",
      data?.code ?? "error",
      response.status,
    )
  }

  return data as MarketAnalysisResponse
}

const P2P_HISTORY_CACHE_KEY_PREFIX = "vex_p2p_history_cache_"
const P2P_SUMMARY_CACHE_KEY_PREFIX = "vex_p2p_summary_cache_"

type CachedP2PHistory = {
  data: P2PHistoryResponse
  cachedAt: string
}

type CachedP2PSummary = {
  data: P2PHistorySummaryResponse
  cachedAt: string
}

function saveP2PHistoryToCache(range: P2PHistoryRange, interval: P2PCandleInterval, data: P2PHistoryResponse) {
  const payload: CachedP2PHistory = { data, cachedAt: new Date().toISOString() }
  localStorage.setItem(`${P2P_HISTORY_CACHE_KEY_PREFIX}${range}_${interval}`, JSON.stringify(payload))
}

function getCachedP2PHistory(range: P2PHistoryRange, interval: P2PCandleInterval): CachedP2PHistory | null {
  const raw = localStorage.getItem(`${P2P_HISTORY_CACHE_KEY_PREFIX}${range}_${interval}`)
  if (!raw) return null

  try {
    return JSON.parse(raw) as CachedP2PHistory
  } catch {
    localStorage.removeItem(`${P2P_HISTORY_CACHE_KEY_PREFIX}${range}_${interval}`)
    return null
  }
}

function saveP2PSummaryToCache(range: P2PHistoryRange, data: P2PHistorySummaryResponse) {
  const payload: CachedP2PSummary = { data, cachedAt: new Date().toISOString() }
  localStorage.setItem(`${P2P_SUMMARY_CACHE_KEY_PREFIX}${range}`, JSON.stringify(payload))
}

function getCachedP2PSummary(range: P2PHistoryRange): CachedP2PSummary | null {
  const raw = localStorage.getItem(`${P2P_SUMMARY_CACHE_KEY_PREFIX}${range}`)
  if (!raw) return null

  try {
    return JSON.parse(raw) as CachedP2PSummary
  } catch {
    localStorage.removeItem(`${P2P_SUMMARY_CACHE_KEY_PREFIX}${range}`)
    return null
  }
}

export async function getP2PHistory(range: P2PHistoryRange, interval: P2PCandleInterval = "hour") {
  try {
    const response = await fetch(`${API_BASE}/p2p/history/?range=${range}&interval=${interval}`)

    if (!response.ok) {
      throw new Error("No se pudo obtener el historial de USDT P2P")
    }

    const data: P2PHistoryResponse = await response.json()

    if (!data.ok) {
      throw new Error("La API respondió con error en el historial de USDT P2P")
    }

    saveP2PHistoryToCache(range, interval, data)

    return {
      data,
      fromCache: false,
      cachedAt: null,
    }
  } catch (error) {
    const cached = getCachedP2PHistory(range, interval)

    if (cached) {
      return {
        data: cached.data,
        fromCache: true,
        cachedAt: cached.cachedAt,
      }
    }

    throw error
  }
}

export async function getP2PHistorySummary(range: P2PHistoryRange) {
  try {
    const response = await fetch(`${API_BASE}/p2p/history/summary/?range=${range}`)

    if (!response.ok) {
      throw new Error("No se pudo obtener el resumen de USDT P2P")
    }

    const data: P2PHistorySummaryResponse = await response.json()

    if (!data.ok) {
      throw new Error("La API respondió con error en el resumen de USDT P2P")
    }

    saveP2PSummaryToCache(range, data)

    return {
      data,
      fromCache: false,
      cachedAt: null,
    }
  } catch (error) {
    const cached = getCachedP2PSummary(range)

    if (cached) {
      return {
        data: cached.data,
        fromCache: true,
        cachedAt: cached.cachedAt,
      }
    }

    throw error
  }
}

// =========================================================
// VISTA PROFESIONAL: TIMEFRAMES REALES + INDICADORES
// =========================================================

export async function getP2PTimeframeCandles(
  range: P2PHistoryRange,
  timeframe: P2PTimeframeKey,
  options: { indicators?: string[]; side?: P2PSide; signal?: AbortSignal } = {},
) {
  const params = new URLSearchParams({ range, timeframe, side: options.side ?? "SELL" })

  if (options.indicators?.length) {
    params.set("indicators", options.indicators.join(","))
  }

  const response = await fetch(`${API_BASE}/p2p/history/?${params.toString()}`, {
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error("No se pudo obtener el gráfico profesional de USDT P2P")
  }

  const data: P2PHistoryChartResponse = await response.json()

  if (!data.ok) {
    throw new Error("La API respondió con error en el gráfico de USDT P2P")
  }

  return data
}

export async function getP2PMarketStatus(
  options: { side?: P2PSide; signal?: AbortSignal } = {},
) {
  const side = options.side ?? "SELL"

  const response = await fetch(`${API_BASE}/p2p/market-status/?side=${side}`, {
    signal: options.signal,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.ok) {
    throw new MarketAnalysisError(
      data?.error ?? "No se pudo obtener el estado del mercado P2P.",
      data?.code ?? "error",
      response.status,
    )
  }

  return data as P2PMarketStatusResponse
}

export async function getP2PMarketAnalysis(
  range: P2PAnalysisRange,
  options: { refresh?: boolean; signal?: AbortSignal } = {},
) {
  const response = await fetch(`${API_BASE}/p2p/analysis/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-ID": getDeviceId(),
    },
    // El frontend solo dice qué analizar; Django construye el
    // snapshot real y nunca confía en cifras enviadas desde aquí.
    body: JSON.stringify({
      source: "binance_p2p",
      side: "SELL",
      range,
      refresh: options.refresh ?? false,
    }),
    signal: options.signal,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.ok) {
    throw new MarketAnalysisError(
      data?.error ?? "No se pudo generar el análisis en este momento.",
      data?.code ?? "error",
      response.status,
    )
  }

  return data as P2PMarketAnalysisResponse
}

// =========================================================
// MERCADO P2P MULTI-NOTIONAL (BUY + SELL, varios tamaños)
// =========================================================

export async function getP2PMarketCurrent(options: { signal?: AbortSignal } = {}) {
  const response = await fetch(`${API_BASE}/p2p/market/`, { signal: options.signal })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.ok) {
    throw new MarketAnalysisError(
      data?.error ?? "No se pudo obtener el estado del mercado P2P.",
      data?.code ?? "error",
      response.status,
    )
  }

  return data as P2PMarketCurrentResponse
}

export async function getP2PNotionalHistory(
  side: P2PSideSelection,
  notional: number,
  range: string,
  granularity: P2PTimeframeKey,
  options: { signal?: AbortSignal } = {},
) {
  const params = new URLSearchParams({
    side,
    notional: String(notional),
    range,
    granularity,
  })

  const response = await fetch(`${API_BASE}/p2p/history/?${params.toString()}`, {
    signal: options.signal,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? "No se pudo obtener el historial multi-notional.")
  }

  return data as P2PNotionalHistoryResponse
}