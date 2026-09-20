export type PricesHomeData = {
  bcv: {
    USD: number
    EUR: number
  }
  binance_best_price: number
  average_price: number
  best_merchant: {
    nickName: string
    price: number
    identity: string | null
    payTypes: string[]
  }
  spread: {
    absolute: number | null
    percent: number | null
  }
  binance_simple: {
    nickName: string
    price: number
    identity: string | null
    payTypes: string[]
  }[]
  updated_at: string
}

export type PricesHomeResponse = {
  ok: boolean
  data: PricesHomeData
}

export type DailyCloseHistoryItem = {
  date: string
  bcv: number
  binance_best_price: number
  average_price: number
  spread_absolute: number
  spread_percent: number
  created_at: string
}

export type DailyCloseHistoryResponse = {
  ok: boolean
  count: number
  data: DailyCloseHistoryItem[]
}

export type PriceChartRange = "24h" | "7d" | "30d"

export type PriceChartGranularity = "snapshot" | "daily"

export type PriceChartPoint = {
  at: string
  date?: string
  bcv: number
  eur_bcv: number | null
  binance_best_price: number
  average_price: number
  spread_absolute: number | null
  spread_percent: number | null
}

/** Clave pública de cada serie tal y como la espera el backend. */
export type PriceSource = "average" | "bcv" | "usdt"

export type PriceChartSummary = {
  series: PriceSource
  series_label: string
  open: number | null
  close: number | null
  change: number | null
  change_percent: number | null
  high: number | null
  low: number | null
  high_at: string | null
  low_at: string | null
  average: number | null
  samples: number
  first_at: string
  last_at: string
}

/** Vela agregada en Django a partir de muestras reales. */
export type PriceCandle = {
  /** Segundos UNIX: lo que consume lightweight-charts. */
  time: number
  at: string
  open: number
  high: number
  low: number
  close: number
  samples: number
}

export type PriceCandlesPayload = {
  interval: "hour" | "day"
  interval_seconds: number
  count: number
  available: boolean
  low_detail: boolean
  unavailable_reason: string | null
  data: PriceCandle[]
}

export type PriceHistoryChartResponse = {
  ok: boolean
  range: PriceChartRange
  source: PriceSource
  source_label: string
  granularity: PriceChartGranularity
  count: number
  summary: PriceChartSummary | null
  candles: PriceCandlesPayload
  data: PriceChartPoint[]
}

// =========================================================
// ANÁLISIS DE MERCADO CON IA
// =========================================================

export type MarketTrend = "up" | "down" | "flat"

export type MarketVolatility = "low" | "moderate" | "high"

export type MarketAnalysis = {
  headline: string
  summary: string
  trend: MarketTrend
  volatility: MarketVolatility
  highlights: string[]
}

export type MarketAnalysisContext = {
  range: PriceChartRange
  source: PriceSource
  source_label: string
  candle_interval: "hour" | "day"
  summary: {
    open: number | null
    close: number | null
    high: number | null
    low: number | null
    average: number | null
    change: number | null
    change_percent: number | null
    samples: number
    first_at: string
    last_at: string
  } | null
}

export type MarketAnalysisResponse = {
  ok: boolean
  analysis: MarketAnalysis
  context: MarketAnalysisContext
  model: string
  cached: boolean
}

export type MarketAnalysisStatusResponse = {
  ok: boolean
  available: boolean
  model: string
  model_installed: boolean
  reason: string | null
  code: string | null
}

export type P2PHistoryRange = "24h" | "7d" | "30d" | "90d" | "all"

export type P2PCandleInterval = "hour" | "day"

export type P2PHistoryFilters = {
  amount_usdt: number | null
  trade_type: "SELL"
  range: string | null
  date: string | null
}

export type P2PCandle = {
  at: string
  amount_usdt: number
  open: number
  high: number
  low: number
  close: number
  best: number
  best_estimated_ves: number
  average_verified_offers: number
  samples: number
}

export type P2PHistoryResponse = {
  ok: boolean
  filters: P2PHistoryFilters
  interval: P2PCandleInterval | "raw"
  total_records: number
  returned_records: number
  truncated: boolean
  data: P2PCandle[]
}

export type P2PHistorySummary = {
  samples: number
  amount_usdt: number
  open: number
  close: number
  change: number
  change_percent: number | null
  best_price: number
  best_estimated_ves: number
  best_price_at: string
  lowest_price: number
  lowest_price_at: string
  highest_price: number
  highest_price_at: string
  first_capture_at: string
  last_capture_at: string
}

export type P2PHistorySummaryResponse = {
  ok: boolean
  has_data: boolean
  filters: P2PHistoryFilters
  summary: P2PHistorySummary | null
}