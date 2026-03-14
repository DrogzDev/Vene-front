import type {
  PricesHomeResponse,
  PricesHomeData,
  DailyCloseHistoryResponse,
  DailyCloseHistoryItem,
} from "../types/prices"

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