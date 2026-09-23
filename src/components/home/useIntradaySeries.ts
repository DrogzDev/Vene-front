import { useEffect, useState } from "react"

import { getPriceHistoryChart } from "../../services/pricesApi"
import type { PriceChartPoint, PriceSource } from "../../types/prices"

const FIELD: Record<PriceSource, keyof PriceChartPoint> = {
  average: "average_price",
  bcv: "bcv",
  usdt: "binance_best_price",
  eur: "eur_bcv",
}

/** Caché de la sesión: volver a 24H no repite la petición. */
const cache = new Map<PriceSource, number[]>()

/**
 * Muestras reales de las últimas 24 h de una serie, pedidas SOLO cuando
 * el usuario elige el período 24H (endpoint existente del historial).
 *
 * undefined = cargando o no pedido; null = no disponible.
 */
export function useIntradaySeries(source: PriceSource, enabled: boolean) {
  const [loaded, setLoaded] = useState<{ source: PriceSource; values: number[] | null } | null>(null)

  useEffect(() => {
    if (!enabled || cache.has(source)) return

    const controller = new AbortController()

    getPriceHistoryChart("24h", source, { signal: controller.signal })
      .then(({ data }) => {
        const values = data.data
          .map((point) => point[FIELD[source]])
          .filter((value): value is number => typeof value === "number" && Number.isFinite(value))

        cache.set(source, values)
        setLoaded({ source, values })
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ source, values: null })
      })

    return () => controller.abort()
  }, [source, enabled])

  if (!enabled) return undefined

  const cached = cache.get(source)
  if (cached) return cached

  return loaded?.source === source ? loaded.values : undefined
}
