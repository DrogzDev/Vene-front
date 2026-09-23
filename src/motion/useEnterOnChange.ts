import { useLayoutEffect, useRef } from "react"
import type { RefObject } from "react"

import { DUR, EASE, gsap, withMotion } from "./motion"

/**
 * Cuando `changeKey` cambia (p. ej. Simple → Profesional), el contenido
 * nuevo entra en cascada: fade + 6 px, 30 ms entre bloques `data-enter`.
 * Así el cambio de vista no se lee como un desmontaje brusco. No actúa
 * en el primer render: de eso se encarga la entrada de pantalla.
 */
export function useEnterOnChange(rootRef: RefObject<HTMLElement | null>, changeKey: string) {
  const previousKey = useRef(changeKey)

  useLayoutEffect(() => {
    if (previousKey.current === changeKey) return

    previousKey.current = changeKey

    const root = rootRef.current

    if (!root) return

    return withMotion(root, () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-enter]", root)

      gsap.from(items.length > 0 ? items : root, {
        opacity: 0,
        y: 6,
        duration: DUR.base,
        ease: EASE.out,
        stagger: 0.03,
        clearProps: "opacity,transform",
      })
    })
  }, [rootRef, changeKey])
}
