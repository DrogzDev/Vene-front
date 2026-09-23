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
  /** Euro BCV del cierre. Ya lo enviaba Django; null si no se capturó. */
  eur_bcv: number | null
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

export type PriceChartRange = "24h" | "7d" | "30d" | "90d"

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
export type PriceSource = "average" | "bcv" | "usdt" | "eur"

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

// =========================================================
// MEJOR HORA OBSERVADA DEL DÍA
// =========================================================

/** Una franja horaria con su resumen. Django la calcula con MEDIANA,
 *  para que un anuncio atípico no corone una hora que nunca estuvo
 *  realmente disponible. */
export type HourBucket = {
  hour: number
  hour_start: string
  hour_end: string
  sample_count: number
  median_price: number
  mean_price: number
  min_price: number
  max_price: number
}

export type IntradayBestHours = {
  date: string
  notional: number
  min_samples: number
  buckets_considered: number
  /** null cuando no hubo muestra suficiente. No se interpola. */
  best_buy_hour: HourBucket | null
  best_sell_hour: HourBucket | null
}

export type BestHoursResponse = IntradayBestHours & {
  ok: boolean
  side: P2PSide
  buckets: HourBucket[]
}

// =========================================================
// OFERTA DE DIVISAS (intervención digital bancaria)
// =========================================================

/** Ojo con la diferencia entre estos estados:
 *
 *  USUAL_WINDOW_MISSED  no apareció en su ventana habitual, pero el
 *                       monitoreo sigue: NO es ausencia del día.
 *  EXPECTED_BUT_NOT_SEEN cerró todo el período sin ninguna activación,
 *                       con el lector operativo.
 *  UNKNOWN              no hay cobertura suficiente para concluir nada. */
export type FxSupplyStatus =
  | "CONFIRMED"
  | "CONFIRMED_EARLY"
  | "CONFIRMED_LATE"
  | "USUAL_WINDOW_MISSED"
  | "MONITORING"
  | "EXPECTED_BUT_NOT_SEEN"
  | "UNKNOWN"

export type FxSupplyStage =
  | "pre_window"
  | "usual_window"
  | "extended_monitoring"
  | "closed"

export type FxSupplyInstitutionState = {
  institution: string
  label: string
  status: FxSupplyStatus
  stage: FxSupplyStage
  event_count: number
  usual_window_passed: boolean
  monitoring_closed: boolean
  monitor_until: string
  reader_coverage: number | null
  reader_coverage_ok: boolean
  first_event_time?: string
  last_event_time?: string
  rate?: number
  early_event_count?: number
  late_event_count?: number
}

export type FxSupplyContext = Record<string, FxSupplyInstitutionState>

export type FxSupplySignal = {
  stage: FxSupplyStage
  status: FxSupplyStatus
  institution: string
  signal: "possible_supply_pressure" | "supply_available" | "no_signal"
  /** Deliberadamente NO se llama "confidence": no es una probabilidad
   *  predictiva, es cuántas métricas del mercado concuerdan. */
  support_level: "low" | "medium" | "high"
  supporting_metrics: string[]
}

/** Etiqueta de madurez de la muestra. Con "insufficient" el bloque de
 *  cifras viene vacío a propósito. */
export type FxSupplyMaturity =
  | "insufficient"
  | "preliminary"
  | "limited"
  | "established_sample"

export type FxSupplyStatBlock = {
  sample_size: number
  maturity: FxSupplyMaturity
  median_change_1h?: number
  median_change_3h?: number
  median_change_6h?: number
  median_change_12h?: number
  median_change_24h?: number
  historical_up_frequency_1h?: number
  historical_up_frequency_3h?: number
  historical_up_frequency_6h?: number
  historical_up_frequency_12h?: number
}

/** Familia A: la jornada. "¿Qué ocurre en días sin intervención?" */
export type FxSupplyDayStats = {
  usual_window_missed?: {
    anchor: "usual_window_end"
    institution: string
    available: boolean
    with_event: FxSupplyStatBlock
    without_event: FxSupplyStatBlock
  }
  full_day_without_event?: {
    anchor: "monitor_until"
    institution: string
    available: boolean
    with_event: FxSupplyStatBlock
    without_event: FxSupplyStatBlock
  }
}

/** Familia B: el evento. "¿Qué hace el P2P después de una intervención?"
 *  Nunca se mezcla con la familia A: son preguntas distintas. */
export type FxSupplyEventStats = {
  institution: string
  available: boolean
  usual_window?: FxSupplyStatBlock
  early?: FxSupplyStatBlock
  late?: FxSupplyStatBlock
}

export type FxSupplyBundle = {
  intraday: IntradayBestHours | null
  fx_supply_context: FxSupplyContext | null
  fx_supply_signal: FxSupplySignal | null
  fx_supply_day_stats: FxSupplyDayStats | null
  fx_supply_event_stats: FxSupplyEventStats | null
}

export type P2PMarketStatusResponse = P2PMarketSnapshot &
  Partial<FxSupplyBundle> & {
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
  analysis_id: number
  snapshot: P2PMarketSnapshot
  range: P2PAnalysisRange
  model: string
  trigger: string
  generated_at: string
  cached: boolean
  /** Verdadero cuando se devolvió un análisis ya guardado y NO se
   *  invocó al modelo. */
  cached_analysis: boolean
} & Partial<FxSupplyBundle>

// =========================================================
// STREAMING DEL ANÁLISIS (SSE)
// =========================================================

export type AiStreamMetadata = {
  analysis_id: number
  input_hash: string
  model: string
  prompt_version: string
  trigger: string
  cached_analysis: boolean
  generated_at: string
  market_state: P2PMarketState
  risk_level: P2PRiskLevel
}

/**
 * Lectura oferta bancaria + reacción del mercado que Django calcula para
 * el análisis IA (api/services/market_reading.py).
 *
 * `observations` son HECHOS registrados; `derived_signals` son
 * INFERENCIAS sobre esos hechos (no miden cuántas divisas hay). Cualquier
 * campo puede faltar: sin muestra suficiente el backend no lo manda.
 */
export type InterventionEffect = "effective" | "partial" | "absorbed" | "inconclusive"

export type FxSupplyPressure = "low" | "moderate" | "high"

export type SupplyMarketScenario =
  | "no_supply_rising"
  | "supply_absorbed"
  | "supply_relief"
  | "no_supply_stable"
  | "no_supply_falling"
  | "supply_reaction_pending"
  | "before_supply_window"
  | "no_reliable_supply_data"

export type BankSupplyInstitution = {
  label: string
  count: number
  status?: FxSupplyStatus | null
  stage?: FxSupplyStage | null
  usual_window?: string | null
  monitor_until?: string | null
  first_time?: string
  last_time?: string
  minutes_since_last?: number
}

export type InterventionReaction = {
  institution: string
  label: string
  time: string
  minutes_since: number
  price_before?: number | null
  price_at_event?: number | null
  change_60m_before?: number | null
  price_after_15m?: number
  change_after_15m?: number | null
  price_after_30m?: number
  change_after_30m?: number | null
  price_after_60m?: number
  change_after_60m?: number | null
  samples_after: number
  change_since_event?: number | null
}

export type MoveMagnitude = {
  label: "flat" | "normal" | "strong" | "exceptional"
  percentile_vs_7d: number
  windows: number
}

export type MarketReading = {
  observations: {
    now_local: string
    bank_supply_today: {
      total_interventions: number
      by_institution: Record<string, BankSupplyInstitution>
    }
    interventions_today?: InterventionReaction[]
    reference_price_now?: number
  }
  derived_signals: {
    ves_direction: "weakening" | "strengthening" | "stable" | null
    momentum_1h: "up" | "down" | "flat" | null
    bank_supply_absence_is_meaningful: boolean | null
    bank_intervention_effect: InterventionEffect | null
    fx_supply_pressure: FxSupplyPressure | null
    fx_supply_pressure_basis: string[] | null
    supply_market_scenario: SupplyMarketScenario
    move_magnitude: Partial<Record<"1h" | "24h", MoveMagnitude>> | null
    effect_evaluated_on?: { institution: string; time: string }
  }
}

export type AiStreamMetrics = FxSupplyBundle & {
  snapshot: P2PMarketSnapshot
  market_state: P2PMarketState
  risk_level: P2PRiskLevel
  fx_event_context: Record<string, unknown> | null
  market_reading?: MarketReading | null
}

export type AiStreamDone = {
  analysis_id: number
  headline: string
  analysis_text: string
  generation_ms: number | null
  prompt_tokens: number | null
  cached_prompt_tokens: number | null
  output_tokens: number | null
}

// =========================================================
// HISTORIAL DE ANÁLISIS IA
// =========================================================

export type AiAnalysisTrigger =
  | "manual"
  | "checkpoint"
  | "fx_event"
  | "fx_event_followup"
  | "daily_summary"

export type AiAnalysisListItem = {
  id: number
  generated_at: string
  headline: string
  current_price: number | null
  market_state: P2PMarketState
  risk_level: P2PRiskLevel
  source: string
  side: P2PSide
  notional: number | null
  range: string
  trigger: AiAnalysisTrigger
  checkpoint_key: string
}

export type AiAnalysisHistoryResponse = {
  ok: boolean
  page: number
  page_size: number
  total: number
  has_next: boolean
  results: AiAnalysisListItem[]
}

export type AiAnalysisDetailResponse = P2PMarketAnalysisResponse

// =========================================================
// RESUMEN DIARIO
// =========================================================

export type DailyMarketSummaryResponse = {
  ok: boolean
  date: string
  open: number | null
  close: number | null
  high: number | null
  low: number | null
  change: number | null
  change_percent: number | null
  best_buy_hour: HourBucket | null
  best_sell_hour: HourBucket | null
  max_drawdown: number | null
  volatility: string
  spread_stats: Record<string, number>
  bcv_premium_avg: number | null
  alerts_count: number
  fx_supply: Record<string, FxSupplyInstitutionState>
  headline: string
  summary: string
  model: string
  generated_at: string
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