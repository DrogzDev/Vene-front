import { useLayoutEffect } from "react"
import type { RefObject } from "react"

import { EASE, gsap, withMotion } from "./motion"

/**
 * Aparición en cascada la PRIMERA vez que un bloque entra en pantalla
 * (timeline de eventos). Hacer scroll arriba y abajo no la repite.
 *
 * El estado inicial (opacity 0, y 6) se fija por JS antes del pintado,
 * nunca por CSS. Sin IntersectionObserver o con reduced-motion no se
 * oculta nada y los elementos se ven desde el principio.
 */
export function useRevealOnce(rootRef: RefObject<HTMLElement | null>, selector: string) {
  useLayoutEffect(() => {
    const root = rootRef.current

    if (!root || typeof IntersectionObserver === "undefined") return

    return withMotion(root, (context) => {
      const items = gsap.utils.toArray<HTMLElement>(selector, root)

      if (items.length === 0) return

      gsap.set(items, { opacity: 0, y: 6 })

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return

          observer.disconnect()

          // Se registra en el contexto para que el desmontaje lo revierta.
          context.add(() => {
            gsap.to(items, {
              opacity: 1,
              y: 0,
              duration: 0.28,
              ease: EASE.out,
              stagger: 0.04,
              clearProps: "opacity,transform",
            })
          })
        },
        { threshold: 0.15 },
      )

      observer.observe(root)

      return () => observer.disconnect()
    })
  }, [rootRef, selector])
}
