/** Las cuatro tasas principales de Inicio. "Personalizada" vive en el conversor. */
export type HomeRateMode = "USD" | "EUR" | "USDT" | "AVERAGE"

export const HOME_RATE_OPTIONS: { key: HomeRateMode; label: string }[] = [
  { key: "USD", label: "Dólar" },
  { key: "EUR", label: "Euro" },
  { key: "USDT", label: "USDT" },
  { key: "AVERAGE", label: "Promedio" },
]
