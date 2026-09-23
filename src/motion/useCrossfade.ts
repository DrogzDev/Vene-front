import { useLayoutEffect, useRef } from "react"
import type { RefObject } from "react"

import { EASE, gsap, withMotion } from "./motion"

/**
 * Transición breve de un bloque cuando cambia lo que representa
 * (período, timeframe, fuente): opacidad .65 → 1 en ~200 ms.
 *
 * Solo toca el contenedor. El gráfico de dentro se actualiza como
 * siempre; no se anima ni un punto ni una vela.
 *
 * `changeKey` debe ser un valor primitivo (p. ej. `${range}-${source}`).
 * No se anima en el primer render ni si la clave no cambió.
 */
export function useCrossfade(
  ref: RefObject<HTMLElement | null>,
  changeKey: string,
  /** Variante para textos: parte de más transparente y sube unos px. */
  { fromOpacity = 0.65, y = 0 }: { fromOpacity?: number; y?: number } = {},
) {
  const previousKey = useRef(changeKey)

  useLayoutEffect(() => {
    if (previousKey.current === changeKey) return

    previousKey.current = changeKey

    const element = ref.current

    if (!element) return

    return withMotion(element, () => {
      gsap.fromTo(
        element,
        { opacity: fromOpacity, y },
        { opacity: 1, y: 0, duration: 0.2, ease: EASE.out, clearProps: "opacity,transform" },
      )
    })
  }, [ref, changeKey, fromOpacity, y])
}
