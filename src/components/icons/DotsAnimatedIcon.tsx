import { useEffect, useLayoutEffect, useRef } from "react"

import { EASE, gsap, withMotion } from "../../motion/motion"

/*
 * Icono oficial de Más: el "dots" de Tabler, sin rediseñar
 * (src/assets/venecambio-ui-icons/dots.svg es el original).
 *
 * Partes (data-part), de izquierda a derecha:
 *   dot-1  M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0    centro (5, 12)
 *   dot-2  M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0   centro (12, 12)
 *   dot-3  M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0   centro (19, 12)
 * (El <path> invisible de 24×24 de Tabler se omite.)
 *
 * Entrada (~0,6 s, una vez): los puntos aparecen creciendo desde su
 * centro, de izquierda a derecha.
 *
 * Animación continua (siempre): ola tipo "escribiendo…". Cada punto sube
 * 2,5 px y baja con un leve aumento de tamaño, uno tras otro, con una
 * pausa corta entre olas. El navegador la pausa sola con la app en segundo
 * plano.
 *
 * Solo transform y opacity. Con prefers-reduced-motion no se anima nada.
 */

type Props = {
  className?: string
  strokeWidth?: number
  /** Retraso de la entrada, para sincronizarla con la de la pantalla. */
  delay?: number
  /** La entrada solo se ve la primera vez que se monta con esta clave. */
  onceKey?: string
}

const played = new Set<string>()

const DOTS = [
  { part: "dot-1", d: "M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0", cx: 5 },
  { part: "dot-2", d: "M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0", cx: 12 },
  { part: "dot-3", d: "M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0", cx: 19 },
] as const

/** Cada punto escala desde su propio centro. */
const origin = (index: number) => `${DOTS[index].cx} 12`

export default function DotsAnimatedIcon({
  className = "h-5 w-5",
  strokeWidth = 2,
  delay = 0,
  onceKey,
  ...rest
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const entranceRef = useRef<gsap.core.Timeline | null>(null)

  // Entrada: los puntos crecen desde su centro.
  useLayoutEffect(() => {
    const svg = svgRef.current

    if (!svg) return
    if (onceKey && played.has(onceKey)) return

    return withMotion(svg, () => {
      const dots = gsap.utils.toArray<SVGPathElement>(svg.querySelectorAll('[data-part^="dot-"]'))

      const tl = gsap.timeline({
        delay,
        onComplete: () => {
          if (onceKey) played.add(onceKey)
        },
      })

      dots.forEach((dot, index) => {
        tl.from(
          dot,
          {
            scale: 0,
            opacity: 0,
            svgOrigin: origin(index),
            duration: 0.35,
            ease: EASE.strong,
            clearProps: "transform,opacity",
          },
          index * 0.1,
        )
      })

      entranceRef.current = tl

      return () => {
        entranceRef.current = null
      }
    })
  }, [delay, onceKey])

  // Ola continua, siempre.
  useEffect(() => {
    const svg = svgRef.current

    if (!svg) return

    return withMotion(svg, () => {
      const dots = gsap.utils.toArray<SVGPathElement>(svg.querySelectorAll('[data-part^="dot-"]'))
      const entrance = entranceRef.current
      const wait = entrance?.parent ? Math.max(0, entrance.endTime() - entrance.parent.time()) : 0

      const wave = gsap.timeline({ delay: wait + 0.2, repeat: -1, repeatDelay: 0.7 })

      dots.forEach((dot, index) => {
        wave.to(
          dot,
          {
            y: -2.5,
            scale: 1.25,
            svgOrigin: origin(index),
            duration: 0.32,
            ease: "sine.out",
            yoyo: true,
            repeat: 1,
          },
          index * 0.16,
        )
      })

      return () => {
        wave.kill()
        gsap.set(dots, { clearProps: "transform" })
      }
    })
  }, [])

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={`shrink-0 ${className}`}
      {...rest}
    >
      {DOTS.map((dot) => (
        <path key={dot.part} data-part={dot.part} d={dot.d} />
      ))}
    </svg>
  )
}
