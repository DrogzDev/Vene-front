import { useEffect, useState } from "react"

import { getAiAnalysisHistory } from "../../services/pricesApi"
import type { AiAnalysisListItem } from "../../types/prices"

/** Más viejo que esto, la tarjeta lo dice ("Análisis de hace 2 días"). */
const STALE_AFTER_MS = 24 * 60 * 60 * 1000

export type LatestAiAnalysis = {
  analysis: AiAnalysisListItem | null | undefined
  stale: boolean
}

/**
 * Último análisis IA GUARDADO (GET de lectura; no ejecuta el modelo).
 *
 * undefined = cargando; null = no hay ninguno o no se pudo leer. En ese
 * caso la tarjeta invita a pedir un análisis en vez de inventar uno.
 */
export function useLatestAiAnalysis(): LatestAiAnalysis {
  const [state, setState] = useState<LatestAiAnalysis>({ analysis: undefined, stale: false })

  useEffect(() => {
    const controller = new AbortController()

    getAiAnalysisHistory({ pageSize: 1, signal: controller.signal })
      .then((response) => {
        const analysis = response.results[0] ?? null
        const generatedAt = analysis ? new Date(analysis.generated_at).getTime() : NaN

        setState({
          analysis,
          stale: Number.isFinite(generatedAt) && Date.now() - generatedAt > STALE_AFTER_MS,
        })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ analysis: null, stale: false })
      })

    return () => controller.abort()
  }, [])

  return state
}
