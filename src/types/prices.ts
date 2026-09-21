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
  /** Segundos UNIX del inicio de la vela: lo que espera lightweight-charts. */
  time: number
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

/**
 * Forma mínima que necesita el chart de un solo lado (P2PProChart).
 * Tanto P2PCandle (histórico crudo) como P2PSideCandle (snapshots
 * multi-notional) la cumplen de forma estructural, así que el chart
 * puede recibir cualquiera de los dos sin adaptadores.
 */
export type P2PChartCandle = {
  time: number
  open: number
  high: number
  low: number
  close: number
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

// =========================================================
// VISTA PROFESIONAL: TIMEFRAMES REALES
// =========================================================

/** Timeframes del catálogo del backend. "1m" no existe: con capturas
 *  cada ~5 min, una vela de 1 minuto sería una copia disfrazada. */
export type P2PTimeframeKey = "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w"

export type P2PSupportedTimeframe = {
  key: P2PTimeframeKey
  label: string
  interval_seconds: number
  /** Calculado contra los datos reales, no una lista fija. */
  available: boolean
  reason: string | null
}

export type P2PTimeframeMeta = {
  key: P2PTimeframeKey
  interval_seconds: number
  available: boolean
  reason: string | null
} | null

/** Series de indicador alineadas por índice con `data` (null = todavía
 *  no hay suficientes muestras para ese punto). */
export type P2PIndicatorSeries = Record<string, (number | null)[]>

export type P2PHistoryChartResponse = P2PHistoryResponse & {
  timeframe: P2PTimeframeMeta
  supported_timeframes: P2PSupportedTimeframe[]
  indicators: P2PIndicatorSeries
}

// =========================================================
// ESTADO DEL MERCADO (indicadores + alertas)
// =========================================================

export type P2PTrend = "bullish" | "neutral" | "bearish"
export type P2PVolatility = "low" | "moderate" | "high"

export type P2PRapidDropAlert = {
  type: "rapid_drop"
  window: string
  window_label: string
  change_percent: number
  elapsed_minutes: number
  threshold_percent: number
}

export type P2PSide = "SELL" | "BUY"
export type P2PSideSelection = P2PSide | "BOTH"

export type P2PMarketSnapshot = {
  symbol: string
  /** Lado protagonista: change_15m/30m/1h/24h, trend, volatility y
   *  percentile_7d se refieren a este lado. El contrario viaja en los
   *  campos "opposite_*". */
  side: P2PSide
  amount_usdt: number
  notional_selected: number

  current_price: number
  current_price_at: string

  change_15m: number | null
  change_30m: number | null
  change_1h: number | null
  change_24h: number | null

  open: number
  high: number
  low: number
  close: number

  distance_from_high: number | null
  percentile_7d: number | null

  trend: P2PTrend
  trend_insufficient_data: boolean
  volatility: P2PVolatility

  sell_price: number | null
  buy_price: number | null
  opposite_side: P2PSide
  opposite_price: number | null
  opposite_change_1h: number | null

  /** Spread real BUY-SELL (no confundir con el premium vs BCV). */
  spread_absolute: number | null
  spread_percent_market: number | null

  bcv_reference_price: number | null
  /** Premium del lado protagonista sobre la tasa BCV. */
  spread_percent: number | null

  liquidity: { sell: number | null; buy: number | null } | null

  samples_24h: number
  alerts: P2PRapidDropAlert[]
}

export type P2PMarketStatusResponse = P2PMarketSnapshot & {
  ok: boolean
}

// =========================================================
// ANÁLISIS IA DEL MERCADO P2P
// =========================================================

export type P2PMarketState = P2PTrend
export type P2PRiskLevel = "low" | "normal" | "elevated" | "high"

export type P2PMarketAnalysis = {
  headline: string
  summary: string
  market_state: P2PMarketState
  risk_level: P2PRiskLevel
  observations: string[]
}

export type P2PAnalysisRange = "15m" | "30m" | "1h" | "24h"

export type P2PMarketAnalysisResponse = {
  ok: boolean
  analysis: P2PMarketAnalysis
  snapshot: P2PMarketSnapshot
  range: P2PAnalysisRange
  model: string
  cached: boolean
}

// =========================================================
// MERCADO P2P MULTI-NOTIONAL (BUY + SELL a varios tamaños)
// =========================================================

/** Niveles reales que expone el backend (settings.P2P_NOTIONAL_USDT_LEVELS). */
export type P2PNotional = 100 | 250 | 500 | 1000

export type P2PMarketCurrentResponse = {
  ok: boolean
  symbol: string
  timestamp: string
  sell: Record<string, number | null>
  buy: Record<string, number | null>
  spread: { absolute: number | null; percent: number | null }
  liquidity: { sell_top10: number | null; buy_top10: number | null }
  depth: {
    sell: Record<string, number>
    buy: Record<string, number>
  }
  dispersion: { sell: number | null; buy: number | null }
  slippage: {
    sell: Record<string, number>
    buy: Record<string, number>
  }
  ads_count: { sell: number; buy: number }
  bcv: {
    reference: number | null
    premium_sell: number | null
    premium_buy: number | null
  }
  scraper_health: {
    status: "healthy" | "degraded" | "offline"
    last_attempt: string | null
    last_successful_scrape: string | null
    latency_ms: number | null
    sell_ads_received: number
    buy_ads_received: number
  }
}

/** Vela agregada desde P2PMarketSnapshot (no P2PCapture crudo). */
export type P2PSideCandle = {
  time: number
  at: string
  open: number
  high: number
  low: number
  close: number
  samples: number
  /** Anuncios válidos promedio en la vela. Nunca "volumen". */
  activity: number
}

export type P2PSideCandlesPayload = {
  data: P2PSideCandle[]
  available: boolean
  reason: string | null
}

export type P2PNotionalHistoryResponse = {
  ok: boolean
  mode: "notional"
  side: P2PSideSelection
  notional: number
  range: string
  granularity: P2PTimeframeKey
  supported_notionals: number[]
  total_snapshots: number
  data: P2PSideCandlesPayload | { sell: P2PSideCandlesPayload; buy: P2PSideCandlesPayload }
}

// =========================================================
// VISTA SIMPLE / PROFESIONAL
// =========================================================

export type P2PViewMode = "simple" | "pro"