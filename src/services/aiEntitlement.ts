import { getDeviceId } from "../utils/device"

/**
 * Cliente del crédito de IA por dispositivo (gratis diario + créditos
 * de Rewarded Ads). Django es la única autoridad: nada de esto decide
 * si se puede generar, solo refleja lo que el backend ya calculó — ver
 * rewards/services.py y el plan de AdMob.
 */

const API_BASE = import.meta.env.VITE_API_URL

export type RewardSessionStatus = "PENDING" | "AWAITING_SSV" | "CLAIMED" | "EXPIRED"

export type AiAccessState = {
  freeAvailable: boolean
  rewardedCredits: number
  canGenerate: boolean
  adRequired: boolean
  dailyLimitReached: boolean
}

export type RewardSessionInfo = {
  sessionId: string
  status: RewardSessionStatus
  showAd: boolean
}

export class AiEntitlementError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = "AiEntitlementError"
    this.code = code
    this.status = status
  }
}

async function readJsonOrThrow(response: Response) {
  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.ok) {
    throw new AiEntitlementError(
      data?.error ?? "No se pudo consultar el crédito de IA.",
      data?.code ?? "error",
      response.status,
    )
  }

  return data
}

export async function getAiAccess(options: { signal?: AbortSignal } = {}): Promise<AiAccessState> {
  const response = await fetch(`${API_BASE}/ai/access/`, {
    headers: { "X-Device-ID": getDeviceId() },
    signal: options.signal,
  })

  const data = await readJsonOrThrow(response)

  return {
    freeAvailable: data.free_available,
    rewardedCredits: data.rewarded_credits,
    canGenerate: data.can_generate,
    adRequired: data.ad_required,
    dailyLimitReached: data.daily_limit_reached,
  }
}

/**
 * Pide (o recupera) la RewardSession activa del dispositivo. El
 * backend reutiliza una PENDING/AWAITING_SSV vigente en vez de crear
 * otra — `showAd` en false significa que ya se vio el anuncio de esta
 * sesión y solo falta esperar la verificación, nunca mostrar un
 * segundo anuncio.
 */
export async function requestRewardSession(
  options: { signal?: AbortSignal } = {},
): Promise<RewardSessionInfo> {
  const response = await fetch(`${API_BASE}/ai/rewards/session/`, {
    method: "POST",
    headers: { "X-Device-ID": getDeviceId() },
    signal: options.signal,
  })

  const data = await readJsonOrThrow(response)

  return { sessionId: data.session_id, status: data.status, showAd: data.show_ad }
}

/**
 * Registra que el SDK de AdMob disparó el evento "Rewarded" del lado
 * del cliente. NO concede ningún crédito por sí mismo (eso solo lo
 * hace la SSV de Google contra Django) — mueve la sesión de PENDING a
 * AWAITING_SSV para que el sheet pase a "Verificando tu recompensa...".
 */
export async function markClientRewarded(
  sessionId: string,
  options: { signal?: AbortSignal } = {},
): Promise<RewardSessionStatus> {
  const response = await fetch(`${API_BASE}/ai/rewards/session/${sessionId}/client-rewarded/`, {
    method: "POST",
    headers: { "X-Device-ID": getDeviceId() },
    signal: options.signal,
  })

  const data = await readJsonOrThrow(response)

  return data.status
}

export async function getRewardSessionStatus(
  sessionId: string,
  options: { signal?: AbortSignal } = {},
): Promise<RewardSessionStatus> {
  const response = await fetch(`${API_BASE}/ai/rewards/session/${sessionId}/status/`, {
    headers: { "X-Device-ID": getDeviceId() },
    signal: options.signal,
  })

  const data = await readJsonOrThrow(response)

  return data.status
}
