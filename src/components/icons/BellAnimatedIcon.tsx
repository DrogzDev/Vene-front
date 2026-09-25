import { useEffect, useLayoutEffect, useRef } from "react"

import { EASE, gsap, withMotion } from "../../motion/motion"

/*
 * Icono oficial de alertas: el "bell-ringing" de Tabler, sin rediseñar
 * (src/assets/venecambio-ui-icons/bell-ringing.svg es el original).
 *
 * Partes (data-part):
 *   bell        M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3…   cuerpo con el asa (arriba, 12,3)
 *   clapper     M9 17v1a3 3 0 0 0 6 0v-1              badajo
 *   wave-left   M3 6.727a11.05 …                       onda de sonido izquierda
 *   wave-right  M21 6.727a11.05 …                      onda de sonido derecha
 * (El <path> invisible de 24×24 de Tabler se omite.)
 *
 * Entrada (~0,6 s, una vez): la campana aparece y las ondas se abren.
 *
 * Animación continua (siempre): la campana se balancea de lado a lado
 * colgando de su asa (12, 3), el badajo la sigue con un leve retraso,
 * luego vibra rápido y las ondas laten; pausa corta y se repite. El
 * navegador la pausa sola con la app en segundo plano.
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

// El asa de la campana: el balanceo gira alrededor de este punto.
const PIVOT = "12 3"

export default function BellAnimatedIcon({
  className = "h-5 w-5",
  strokeWidth = 2,
  delay = 0,
  onceKey,
  ...rest
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const entranceRef = useRef<gsap.core.Timeline | null>(null)

  // Entrada.
  useLayoutEffect(() => {
    const svg = svgRef.current

    if (!svg) return
    if (onceKey && played.has(onceKey)) return

    return withMotion(svg, () => {
      const bell = svg.querySelector('[data-part="swing"]')
      const waves = svg.querySelectorAll('[data-part^="wave-"]')

      const tl = gsap.timeline({
        delay,
        onComplete: () => {
          if (onceKey) played.add(onceKey)
        },
      })

      tl.from(bell, {
        opacity: 0,
        scale: 0.6,
        svgOrigin: PIVOT,
        duration: 0.45,
        ease: EASE.strong,
        clearProps: "transform,opacity",
      }).from(waves, { opacity: 0, duration: 0.3, stagger: 0.08, clearProps: "opacity" }, 0.25)

      entranceRef.current = tl

      return () => {
        entranceRef.current = null
      }
    })
  }, [delay, onceKey])

  // Balanceo + vibración, siempre.
  useEffect(() => {
    const svg = svgRef.current

    if (!svg) return

    return withMotion(svg, () => {
      const bell = svg.querySelector('[data-part="swing"]')
      const clapper = svg.querySelector('[data-part="clapper"]')
      const left = svg.querySelector('[data-part="wave-left"]')
      const right = svg.querySelector('[data-part="wave-right"]')
      const entrance = entranceRef.current
      const wait = entrance?.parent ? Math.max(0, entrance.endTime() - entrance.parent.time()) : 0

      const ring = gsap.timeline({ delay: wait + 0.3, repeat: -1, repeatDelay: 1.1 })

      // Balanceo de lado a lado, cada vez un poco menor (como al soltarla).
      const swings = [16, -14, 11, -8, 4, 0]
      swings.forEach((angle, index) => {
        ring.to(bell, { rotation: angle, svgOrigin: PIVOT, duration: 0.16, ease: "sine.inOut" }, index * 0.16)
        // El badajo va un instante detrás y un poco más lejos.
        ring.to(clapper, { rotation: angle * 0.6, svgOrigin: "12 11", duration: 0.16, ease: "sine.inOut" }, index * 0.16 + 0.04)
      })

      // Onda del lado hacia el que golpea, en cada extremo del balanceo.
      ring
        .to(right, { opacity: 0.35, duration: 0.08, yoyo: true, repeat: 1 }, 0.12)
        .to(left, { opacity: 0.35, duration: 0.08, yoyo: true, repeat: 1 }, 0.28)
        .to(right, { opacity: 0.35, duration: 0.08, yoyo: true, repeat: 1 }, 0.44)
        .to(left, { opacity: 0.35, duration: 0.08, yoyo: true, repeat: 1 }, 0.6)

      // Vibración: temblor rápido y corto, sin rebote exagerado.
      ring.to(bell, {
        x: 0.6,
        duration: 0.04,
        ease: "none",
        yoyo: true,
        repeat: 7,
      }, 1.05)
      ring.set(bell, { x: 0 })

      return () => {
        ring.kill()
        gsap.set([bell, clapper, left, right], { clearProps: "transform,opacity" })
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
      // Visible: al balancearse, el borde de la campana sale un poco del
      // cuadro de 24×24 y no debe recortarse.
      overflow="visible"
      className={`shrink-0 ${className}`}
      {...rest}
    >
      {/* Cuerpo y badajo se balancean juntos desde el asa; el badajo
          además tiene su propio giro, un poco retrasado. */}
      <g data-part="swing">
        <path data-part="bell" d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
        <path data-part="clapper" d="M9 17v1a3 3 0 0 0 6 0v-1" />
      </g>
      <path data-part="wave-right" d="M21 6.727a11.05 11.05 0 0 0 -2.794 -3.727" />
      <path data-part="wave-left" d="M3 6.727a11.05 11.05 0 0 1 2.792 -3.727" />
    </svg>
  )
}
