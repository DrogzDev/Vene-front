import { useCallback, useEffect, useRef, useState } from "react"

import { MarketAnalysisError, getMarketAnalysisStatus } from "../../services/pricesApi"
import { streamP2PMarketAnalysis } from "../../services/aiStream"
import { getTurnstileToken } from "../../utils/turnstile"
import type {
  FxSupplyContext,
  IntradayBestHours,
  MarketReading,
  P2PMarketAnalysis,
  P2PMarketSnapshot,
  P2PMarketState,
  P2PRiskLevel,
  P2PSideSelection,
  BolivarOutlook,
} from "../../types/prices"

/**
 * Orquestación del análisis IA del mercado P2P (estado del drawer y
 * streaming). Movida sin cambios desde la Vista Profesional para que la
 * Simple también la tenga.
 *
 * El análisis es MANUAL: abrir el drawer no lanza nada; solo el botón
 * "Analizar mercado" dentro de él llama al modelo.
 */
export function useP2PAiAnalysis(side: P2PSideSelection, notional: number) {
  const [aiAvailable, setAiAvailable] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiHistoryOpen, setAiHistoryOpen] = useState(false)
  const [aiHistoryDetailId, setAiHistoryDetailId] = useState<number | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiStreaming, setAiStreaming] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<P2PMarketAnalysis | null>(null)
  const [aiStreamedText, setAiStreamedText] = useState("")
  const [aiSnapshot, setAiSnapshot] = useState<P2PMarketSnapshot | null>(null)
  const [aiIntraday, setAiIntraday] = useState<IntradayBestHours | null>(null)
  const [aiFxSupply, setAiFxSupply] = useState<FxSupplyContext | null>(null)
  const [aiReading, setAiReading] = useState<MarketReading | null>(null)
  const [aiGeneratedAt, setAiGeneratedAt] = useState<string | null>(null)
  const [aiCached, setAiCached] = useState(false)

  const aiRequestRef = useRef<AbortController | null>(null)
  const aiClassificationRef = useRef<{
    market_state: P2PMarketState
    risk_level: P2PRiskLevel
    bolivar_outlook: BolivarOutlook | null
  }>({ market_state: "neutral", risk_level: "normal", bolivar_outlook: null })

  // Disponibilidad de IA (depende de si Ollama y el modelo están arriba).
  useEffect(() => {
    const controller = new AbortController()

    getMarketAnalysisStatus({ signal: controller.signal })
      .then((status) => {
        if (!controller.signal.aborted) setAiAvailable(status.available)
      })
      .catch(() => {
        if (!controller.signal.aborted) setAiAvailable(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    return () => {
      aiRequestRef.current?.abort()
    }
  }, [])

  /**
   * Lanza el análisis en streaming. `force` solo llega en true cuando el
   * usuario pulsa "Actualizar análisis".
   */
  const runAiAnalysis = useCallback(
    async (force: boolean) => {
      aiRequestRef.current?.abort()

      const controller = new AbortController()
      aiRequestRef.current = controller

      setAiLoading(true)
      setAiStreaming(false)
      setAiError(null)
      setAiAnalysis(null)
      setAiStreamedText("")

      // El análisis solo entiende SELL/BUY; en "Ambos" el protagonista es SELL.
      const analysisSide = side === "BOTH" ? "SELL" : side

      try {
        // El captcha solo se pide al forzar: es la ruta que salta el
        // caché/lock compartido y de verdad paga una inferencia.
        const captchaToken = force ? await getTurnstileToken("ai_refresh") : undefined

        await streamP2PMarketAnalysis(
          { side: analysisSide, range: "1h", notional, force, captchaToken, signal: controller.signal },
          {
            onMetadata: (data) => {
              if (controller.signal.aborted) return

              aiClassificationRef.current = {
                market_state: data.market_state,
                risk_level: data.risk_level,
                bolivar_outlook: data.bolivar_outlook ?? null,
              }

              setAiCached(data.cached_analysis)
              setAiGeneratedAt(data.generated_at)
              setAiStreaming(!data.cached_analysis)
            },
            onMetrics: (data) => {
              if (controller.signal.aborted) return

              setAiSnapshot(data.snapshot)
              setAiIntraday(data.intraday)
              setAiFxSupply(data.fx_supply_context)
              setAiReading(data.market_reading ?? null)
              setAiLoading(false)
            },
            onToken: (content) => {
              if (controller.signal.aborted) return

              setAiStreamedText((previous) => previous + content)
            },
            onDone: (data) => {
              if (controller.signal.aborted) return

              setAiAnalysis({
                headline: data.headline,
                summary: data.analysis_text,
                market_state: aiClassificationRef.current.market_state,
                risk_level: aiClassificationRef.current.risk_level,
                bolivar_outlook: aiClassificationRef.current.bolivar_outlook,
                observations: [],
              })
              setAiStreaming(false)
              setAiLoading(false)
            },
            onError: (err) => {
              if (controller.signal.aborted) return

              // El texto recibido hasta aquí se conserva a propósito.
              setAiStreaming(false)
              setAiLoading(false)
              setAiError(err.message)
            },
          },
        )
      } catch (err) {
        if (controller.signal.aborted) return

        setAiStreaming(false)

        if (err instanceof Error && err.message.startsWith("captcha_")) {
          setAiError("No se pudo verificar que eres humano. Intenta de nuevo.")
        } else {
          setAiError(err instanceof MarketAnalysisError ? err.message : "Análisis IA no disponible temporalmente.")
        }
      } finally {
        if (!controller.signal.aborted) setAiLoading(false)
      }
    },
    [side, notional],
  )

  const openDrawer = useCallback(() => setAiOpen(true), [])

  /** Cerrar el panel corta el stream: nada de conexiones colgando. */
  const closeDrawer = useCallback(() => {
    aiRequestRef.current?.abort()
    setAiStreaming(false)
    setAiLoading(false)
    setAiOpen(false)
  }, [])

  /** Abre el historial, opcionalmente directo en un análisis guardado. */
  const openHistory = useCallback((detailId: number | null = null) => {
    setAiHistoryDetailId(detailId)
    setAiHistoryOpen(true)
  }, [])

  const closeHistory = useCallback(() => {
    setAiHistoryOpen(false)
    setAiHistoryDetailId(null)
  }, [])

  return {
    aiAvailable,
    openDrawer,
    openHistory,
    drawerProps: {
      open: aiOpen,
      loading: aiLoading,
      streaming: aiStreaming,
      error: aiError,
      analysis: aiAnalysis,
      streamedText: aiStreamedText,
      snapshot: aiSnapshot,
      intraday: aiIntraday,
      fxSupply: aiFxSupply,
      reading: aiReading,
      generatedAt: aiGeneratedAt,
      cached: aiCached,
      onClose: closeDrawer,
      onAnalyze: runAiAnalysis,
      onOpenHistory: () => openHistory(null),
    },
    historyProps: {
      open: aiHistoryOpen,
      initialDetailId: aiHistoryDetailId,
      onClose: closeHistory,
    },
  }
}

export type P2PAiAnalysisController = ReturnType<typeof useP2PAiAnalysis>
