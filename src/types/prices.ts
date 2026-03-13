export type BinanceMerchant = {
  nickName: string
  price: number
  userIdentity: string
  payTypes: string[]
}

export type PricesHomeData = {
  bcv: {
    USD: number
    EUR: number
  }
  binance_best_price: number
  best_merchant: {
    nickName: string
    price: number
    userIdentity: string
  }
  spread: {
    absolute: number
    percent: number
  }
  binance_simple: BinanceMerchant[]
  updated_at: string
}

export type PricesHomeResponse = {
  ok: boolean
  data: PricesHomeData
}