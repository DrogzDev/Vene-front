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