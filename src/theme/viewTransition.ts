import type { ResolvedTheme, ThemePreference } from "./theme"

/**
 * Alterna claro/oscuro con una revelación circular que crece desde el
 * punto donde se tocó el botón (View Transitions API): la app "vieja"
 * queda quieta debajo mientras un círculo de la app "nueva" la cubre,
 * en vez de un simple cambio de color de golpe.
 *
 * Sin soporte del navegador (WebViews viejos) o con
 * prefers-reduced-motion, cambia el tema directamente — la animación es
 * un extra, nunca un requisito para que el toggle funcione.
 */
export function toggleThemeWithCircleReveal(
  origin: { x: number; y: number },
  resolved: ResolvedTheme,
  setPreference: (next: ThemePreference) => void,
) {
  const next: ThemePreference = resolved === "dark" ? "light" : "dark"

  const supportsViewTransition = typeof document.startViewTransition === "function"
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  if (!supportsViewTransition || reduced) {
    setPreference(next)
    return
  }

  const endRadius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  )

  const transition = document.startViewTransition(() => {
    setPreference(next)
  })

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${endRadius}px at ${origin.x}px ${origin.y}px)`],
        },
        {
          duration: 550,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      )
    })
    .catch(() => {
      // La transición se pudo cancelar (otro toggle, o cambio de ruta
      // de por medio); el tema ya quedó aplicado igual, solo se pierde
      // el efecto visual.
    })
}
