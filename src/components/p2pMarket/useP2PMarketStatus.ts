import { useEffect, useState } from "react"

import { onAppResume } from "../../services/appLifecycle"
import { MarketAnalysisError, getP2PMarketStatus, peekP2PMarketStatus } from "../../services/pricesApi"
import type { P2PMarketStatusResponse, P2PSideSelection } from "../../types/prices"

/**
 * Estado del mercado P2P (precio actual, 24 h, spread, prima BCV,
 * alertas y oferta de divisas) para el lado protagonista.
 *
 * Misma llamada que ya hacía la Vista Profesional, sin polling; ahora
 * también la usa la Simple para su cabecera.
 */
export function useP2PMarketStatus(side: P2PSideSelection) {
  // Lo último conocido de ese lado se pinta al instante; la cabecera
  // muestra la hora de captura, así que nunca pasa por dato recién leído.
  const [snapshot, setSnapshot] = useState<P2PMarketStatusResponse | null>(() =>
    peekP2PMarketStatus(side === "BOTH" ? "SELL" : side),
  )
  const [loading, setLoading] = useState(true)
  const [resumeTick, setResumeTick] = useState(0)

  useEffect(() => onAppResume(() => setResumeTick((tick) => tick + 1)), [])
  const [error, setError] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    const snapshotSide = side === "BOTH" ? "SELL" : side

    async function load() {
      try {
        setError("")
        setLoading(true)

        const cached = peekP2PMarketStatus(snapshotSide)
        if (cached) setSnapshot(cached)

        const result = await getP2PMarketStatus({ side: snapshotSide, signal: controller.signal })

        if (controller.signal.aborted) return

        setSnapshot(result)
      } catch (err) {
        if (controller.signal.aborted) return

        setError(err instanceof MarketAnalysisError ? err.message : "No se pudo calcular el estado del mercado.")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()

    return () => controller.abort()
  }, [side, resumeTick])

  return { snapshot, loading, error }
}
