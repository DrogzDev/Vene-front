/**
 * Cloudflare Turnstile, cargado perezosamente: el script solo se pide
 * la primera vez que alguien intenta regenerar un análisis con IA, no
 * en cada carga de la app (la mayoría de las visitas nunca lo tocan).
 *
 * El widget se renderiza oculto en modo `execution: "execute"`: no
 * corre solo, se dispara a demanda con `getTurnstileToken()` justo
 * antes de cada petición de refresh/force, así el token siempre es
 * nuevo (los de Turnstile son de un solo uso y expiran a los ~5 min).
 */

type TurnstileRenderOptions = {
  sitekey: string
  execution: "execute"
  /** "execute": el widget no ocupa espacio salvo que de verdad haga
   *  falta mostrar un reto interactivo (tráfico sospechoso). No es un
   *  tamaño ("invisible" no es un valor válido de `size`). */
  appearance: "execute"
  callback: (token: string) => void
  "error-callback": () => void
  "expired-callback": () => void
  "timeout-callback": () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string
      execute: (widgetId: string, options?: { action?: string }) => void
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js"

let scriptPromise: Promise<void> | null = null
let widgetId: string | null = null
let pending: { resolve: (token: string) => void; reject: (error: Error) => void } | null = null

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("No se pudo cargar la verificación anti-bots."))
    document.head.appendChild(script)
  })

  return scriptPromise
}

function settlePending(fn: (p: NonNullable<typeof pending>) => void) {
  if (!pending) return

  const current = pending
  pending = null
  fn(current)
}

async function ensureWidget(): Promise<string> {
  await loadScript()

  if (widgetId !== null) return widgetId

  if (!window.turnstile) {
    throw new Error("La verificación anti-bots no está disponible.")
  }

  // Sin display:none a propósito: con "appearance: execute" el widget ya
  // no ocupa espacio por su cuenta, pero si Cloudflare decide que hace
  // falta un reto interactivo (tráfico sospechoso) tiene que poder
  // mostrarse — oculto con CSS, ese caso quedaría irresoluble.
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.bottom = "12px"
  container.style.right = "12px"
  container.style.zIndex = "2147483647"
  document.body.appendChild(container)

  widgetId = window.turnstile.render(container, {
    sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY as string,
    execution: "execute",
    appearance: "execute",
    callback: (token) => settlePending((p) => p.resolve(token)),
    "error-callback": () => settlePending((p) => p.reject(new Error("captcha_error"))),
    "expired-callback": () => settlePending((p) => p.reject(new Error("captcha_expired"))),
    "timeout-callback": () => settlePending((p) => p.reject(new Error("captcha_timeout"))),
  })

  return widgetId
}

/** Pide un token nuevo. Rechaza si el usuario/red no completan el reto. */
export async function getTurnstileToken(action: string): Promise<string> {
  const id = await ensureWidget()

  return new Promise<string>((resolve, reject) => {
    pending = { resolve, reject }

    window.turnstile?.reset(id)
    window.turnstile?.execute(id, { action })
  })
}
