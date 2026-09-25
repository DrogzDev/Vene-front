import type { PriceSource } from "../types/prices"

const SOURCE_KEY = "vex_price_history_source"

const VALID_SOURCES: PriceSource[] = ["average", "bcv", "usdt", "eur"]

/** `null` si nunca se guardó una fuente o si localStorage no está disponible. */
export function getStoredPriceHistorySource(): PriceSource | null {
  try {
    const raw = localStorage.getItem(SOURCE_KEY)

    return (VALID_SOURCES as string[]).includes(raw ?? "") ? (raw as PriceSource) : null
  } catch {
    return null
  }
}

export function setStoredPriceHistorySource(source: PriceSource) {
  try {
    localStorage.setItem(SOURCE_KEY, source)
  } catch {
    // localStorage puede fallar en navegación privada; no es crítico.
  }
}
