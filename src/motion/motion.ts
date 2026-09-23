import gsap from "gsap"

/*
 * Base común de las animaciones de VeneCambio.
 *
 * Reglas del sistema de movimiento:
 * - Cada animación comunica algo (jerarquía, cambio, navegación). Nada
 *   se mueve "porque sí" ni en bucle.
 * - 150–350 ms, curvas suaves, desplazamientos de pocos píxeles.
 * - Solo transform y opacity (y un clip-path o un fondo puntual).
 * - Nunca se oculta nada por CSS esperando a GSAP: el estado inicial se
 *   fija con from()/set() dentro de useLayoutEffect, antes del pintado.
 *   Si GSAP no llegara a ejecutarse, el contenido se ve igual.
 * - Con prefers-reduced-motion: reduce no se anima nada (ver withMotion).
 * - Los datos (gráficos, velas, ticks) son de React y de la librería de
 *   gráficos; GSAP solo toca la UI que los rodea.
 */

export { gsap }

export const DUR = {
  fast: 0.15,
  base: 0.24,
  sheet: 0.3,
  flash: 0.55,
} as const

export const EASE = {
  out: "power2.out",
  strong: "power3.out",
  in: "power2.in",
} as const

export const MOTION_OK = "(prefers-reduced-motion: no-preference)"
export const MOTION_REDUCED = "(prefers-reduced-motion: reduce)"

export function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(MOTION_REDUCED).matches
    : false
}

/**
 * Ejecuta `setup` solo si el usuario acepta movimiento, dentro de un
 * gsap.matchMedia con `scope` (los selectores quedan limitados a ese
 * nodo). Devuelve la limpieza: revierte todo lo creado, también lo que
 * se añada después con `context.add()`.
 *
 * Con reduced-motion `setup` no corre y el contenido aparece tal cual.
 */
export function withMotion(
  scope: Element | null,
  setup: (context: gsap.Context) => void | (() => void),
) {
  const mm = gsap.matchMedia(scope ?? undefined)

  mm.add(MOTION_OK, (context) => setup(context))

  return () => mm.revert()
}
