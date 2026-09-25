/**
 * Lectura del análisis IA en streaming (SSE sobre fetch).
 *
 * Se usa fetch + ReadableStream y no EventSource por dos razones
 * concretas: EventSource no permite mandar cabeceras y el rate limiting
 * del backend se identifica con X-Device-ID, y además este enfoque
 * encaja con el AbortController que ya usa todo el cliente para
 * cancelar peticiones al cerrar un panel.
 */

import type {
  AiStreamDone,
  AiStreamMetadata,
  AiStreamMetrics,
  P2PAnalysisRange,
  P2PNotional,
  P2PSide,
} from "../types/prices"
import { MarketAnalysisError } from "./pricesApi"
import { getDeviceId } from "../utils/device"

const API_BASE = import.meta.env.VITE_API_URL

export type AiStreamHandlers = {
  onMetadata?: (data: AiStreamMetadata) => void
  onMetrics?: (data: AiStreamMetrics) => void
  onToken?: (content: string) => void
  onDone?: (data: AiStreamDone) => void
  onError?: (error: MarketAnalysisError) => void
}

export type AiStreamParams = {
  side: P2PSide
  range: P2PAnalysisRange
  notional?: P2PNotional | number
  /** Solo cuando el usuario pide explícitamente regenerar. Nunca
   *  automático: sin esto, un análisis idéntico se reutiliza. */
  force?: boolean
  /** Solo importa cuando force es true; el backend lo ignora si no. */
  captchaToken?: string
  signal?: AbortSignal
}

type Frame = {
  event: string
  data: string
}

/**
 * Parte el búfer en frames SSE completos y devuelve el resto.
 *
 * Las líneas que empiezan por ":" son comentarios del protocolo (el
 * backend manda ": ping" cuando el modelo tarda en producir) y se
 * descartan sin tocar el texto que ve el usuario.
 */
function drainFrames(buffer: string): { frames: Frame[]; rest: string } {
  const frames: Frame[] = []
  const parts = buffer.split("\n\n")
  const rest = parts.pop() ?? ""

  for (const raw of parts) {
    let event = "message"
    const dataLines: string[] = []

    for (const line of raw.split("\n")) {
      if (!line || line.startsWith(":")) continue

      if (line.startsWith("event:")) {
        event = line.slice(6).trim()
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim())
      }
    }

    if (dataLines.length > 0) {
      frames.push({ event, data: dataLines.join("\n") })
    }
  }

  return { frames, rest }
}

export async function streamP2PMarketAnalysis(
  params: AiStreamParams,
  handlers: AiStreamHandlers,
): Promise<void> {
  const response = await fetch(`${API_BASE}/p2p/analysis/stream/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-ID": getDeviceId(),
    },
    // El cuerpo solo dice QUÉ analizar. Django construye el snapshot y
    // nunca acepta cifras de mercado que vengan del navegador.
    body: JSON.stringify({
      source: "binance_p2p",
      side: params.side,
      range: params.range,
      notional: params.notional,
      force: params.force ?? false,
      captcha_token: params.captchaToken,
    }),
    signal: params.signal,
  })

  // Un fallo antes de empezar a transmitir llega como JSON normal.
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null)

    throw new MarketAnalysisError(
      data?.error ?? "No se pudo generar el análisis en este momento.",
      data?.code ?? "error",
      response.status,
    )
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let buffer = ""

  try {
    for (;;) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const { frames, rest } = drainFrames(buffer)
      buffer = rest

      for (const frame of frames) {
        let payload: unknown

        try {
          payload = JSON.parse(frame.data)
        } catch {
          continue
        }

        switch (frame.event) {
          case "metadata":
            handlers.onMetadata?.(payload as AiStreamMetadata)
            break

          case "metrics":
            handlers.onMetrics?.(payload as AiStreamMetrics)
            break

          case "token": {
            const { content } = payload as { content?: string }
            if (content) handlers.onToken?.(content)
            break
          }

          case "done":
            handlers.onDone?.(payload as AiStreamDone)
            break

          case "error": {
            const { code, message } = payload as {
              code?: string
              message?: string
            }

            handlers.onError?.(
              new MarketAnalysisError(
                message ?? "El análisis se interrumpió. Intenta nuevamente.",
                code ?? "error",
                200,
              ),
            )
            break
          }
        }
      }
    }
  } finally {
    // Cerrar el lector corta la conexión; el backend lo detecta, para
    // el hilo que habla con Ollama y marca el análisis como fallido en
    // lugar de dejarlo a medias como completo.
    try {
      await reader.cancel()
    } catch {
      // El stream ya estaba cerrado.
    }
  }
}
