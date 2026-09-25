import { useCallback, useEffect, useRef, useState } from "react"

import { MarketAnalysisError } from "../services/pricesApi"
import { showRewardedAd } from "../services/admob"
import {
  getAiAccess,
  getRewardSessionStatus,
  markClientRewarded,
  requestRewardSession,
} from "../services/aiEntitlement"

/**
 * Orquesta el crédito de IA (gratis diario + Rewarded Ads de AdMob),
 * compartido entre el análisis de historial (priceChart.tsx) y el de
 * P2P (useP2PAiAnalysis.ts): mismo saldo por dispositivo, mismo sheet.
 *
 * Django es la única autoridad — este hook nunca decide si se puede
 * generar, solo reacciona a /api/ai/access/ y reintenta la generación
 * real después de que el backend confirme el crédito.
 */

const POLL_INTERVAL_MS = 900
const POLL_BUDGET_MS = 15_000

type FlowState =
  | "closed"
  | "ad_required"
  | "daily_limit_reached"
  | "loading_ad"
  | "awaiting_ssv"
  | "unavailable"
  | "verification_timeout"

const AI_ENTITLEMENT_ERROR_CODES = new Set(["rewarded_ad_required", "daily_ai_limit_reached"])

export function useAiRewardFlow() {
  const [state, setState] = useState<FlowState>("closed")

  const resolverRef = useRef<((granted: boolean) => void) | null>(null)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollAbortRef = useRef<AbortController | null>(null)

  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current !== null) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }

    pollAbortRef.current?.abort()
    pollAbortRef.current = null
  }, [])

  useEffect(() => stopPolling, [stopPolling])

  const settle = useCallback(
    (granted: boolean) => {
      stopPolling()
      resolverRef.current?.(granted)
      resolverRef.current = null
      setState("closed")
    },
    [stopPolling],
  )

  const pollSessionStatus = useCallback(
    (sessionId: string) => {
      const controller = new AbortController()
      pollAbortRef.current = controller
      const deadline = Date.now() + POLL_BUDGET_MS

      const tick = async () => {
        if (controller.signal.aborted) return

        try {
          const status = await getRewardSessionStatus(sessionId, { signal: controller.signal })

          if (controller.signal.aborted) return

          if (status === "CLAIMED") {
            settle(true)
            return
          }

          if (status === "EXPIRED") {
            setState("ad_required")
            return
          }
        } catch {
          // Red inestable: se reintenta hasta agotar el presupuesto.
        }

        if (Date.now() >= deadline) {
          setState("verification_timeout")
          return
        }

        pollTimeoutRef.current = setTimeout(tick, POLL_INTERVAL_MS)
      }

      tick()
    },
    [settle],
  )

  /**
   * Chequeo previo a "Actualizar análisis": si ya hay gratis o crédito
   * disponible, resuelve true de inmediato sin abrir nada. Si no, abre
   * el sheet y la promesa queda pendiente hasta que el usuario complete
   * el anuncio (true) o cierre el sheet (false).
   */
  const ensureEntitlement = useCallback(async (): Promise<boolean> => {
    const access = await getAiAccess().catch(() => null)

    // Sin poder consultar el acceso (red caída, etc.) no se inventa un
    // estado: se deja que el propio intento de generación, que ya trae
    // su verificación real, sea quien decida.
    if (access === null || access.canGenerate) return true

    setState(access.dailyLimitReached ? "daily_limit_reached" : "ad_required")

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const watchAd = useCallback(async () => {
    setState("loading_ad")

    try {
      const session = await requestRewardSession()

      if (session.showAd) {
        const result = await showRewardedAd(session.sessionId)

        if (result === "dismissed") {
          setState("ad_required")
          return
        }

        if (result === "unavailable" || result === "error") {
          setState("unavailable")
          return
        }

        await markClientRewarded(session.sessionId)
      }

      setState("awaiting_ssv")
      pollSessionStatus(session.sessionId)
    } catch {
      setState("unavailable")
    }
  }, [pollSessionStatus])

  const close = useCallback(() => settle(false), [settle])

  const retry = useCallback(() => setState("ad_required"), [])

  /**
   * Envuelve un intento de generación: si el backend rechaza con
   * rewarded_ad_required/daily_ai_limit_reached (carrera — el acceso
   * cambió entre el chequeo previo y esta petición), abre el sheet y,
   * si se resuelve con un crédito nuevo, reintenta UNA vez. Cualquier
   * otro error se propaga tal cual.
   */
  const runWithEntitlement = useCallback(
    async <T,>(attempt: () => Promise<T>): Promise<T> => {
      try {
        return await attempt()
      } catch (err) {
        if (!(err instanceof MarketAnalysisError) || !AI_ENTITLEMENT_ERROR_CODES.has(err.code)) {
          throw err
        }

        setState(err.code === "daily_ai_limit_reached" ? "daily_limit_reached" : "ad_required")

        const granted = await new Promise<boolean>((resolve) => {
          resolverRef.current = resolve
        })

        if (!granted) throw err

        return attempt()
      }
    },
    [],
  )

  return {
    sheetOpen: state !== "closed",
    sheetState: state,
    ensureEntitlement,
    runWithEntitlement,
    watchAd,
    retry,
    close,
  }
}

export type AiRewardFlowController = ReturnType<typeof useAiRewardFlow>
