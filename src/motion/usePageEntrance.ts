import { useLayoutEffect } from "react"
import type { RefObject } from "react"

import { DUR, EASE, gsap, withMotion } from "./motion"

/**
 * Entrada de pantalla: fade + 6–8 px hacia arriba, una sola vez al montar.
 *
 * Si dentro de `rootRef` hay elementos marcados con `data-enter`, se
 * animan ellos en cascada (30 ms entre uno y otro) y la raíz se queda
 * quieta; si no hay ninguno, se anima la raíz entera.
 *
 * Al terminar se limpian las propiedades: un transform residual en un
 * ancestro rompería los `position: fixed` de dentro (hojas, gráfico a
 * pantalla completa).
 */
export function usePageEntrance(rootRef: RefObject<HTMLElement | null>, enabled = true) {
  useLayoutEffect(() => {
    const root = rootRef.current

    if (!root || !enabled) return

    return withMotion(root, () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-enter]", root)

      if (items.length > 0) {
        gsap.from(items, {
          opacity: 0,
          y: 8,
          duration: DUR.base,
          ease: EASE.out,
          stagger: 0.03,
          clearProps: "opacity,transform",
        })
        return
      }

      gsap.from(root, {
        opacity: 0,
        y: 6,
        duration: DUR.base,
        ease: EASE.out,
        clearProps: "opacity,transform",
      })
    })
  }, [rootRef, enabled])
}
