import { useEffect, useLayoutEffect, useRef } from "react"

import { gsap, withMotion } from "../../motion/motion"

/*
 * Icono oficial de IA: el "brain" de Tabler, sin rediseñar
 * (src/assets/venecambio-ui-icons/brain.svg es el original).
 *
 * Partes (data-part), agrupadas por hemisferio:
 *   left   left-top    M5 9.3v-2.8a3.5 3.5 0 0 1 7 0v10   (+ línea central)
 *          left-mid    M6.5 16a3.5 3.5 0 0 1 0 -7h.5
 *          left-bottom M8.5 13a3.5 3.5 0 0 1 3.5 3.5v1…
 *   right  right-top   M19 9.3v-2.8a3.5 3.5 0 0 0 -7 0
 *          right-mid   M17.5 16a3.5 3.5 0 0 0 0 -7h-.5
 *          right-bottom M15.5 13a3.5 3.5 0 0 0 -3.5 3.5v1…
 * (El <path> invisible de 24×24 de Tabler se omite.)
 *
 * Entrada (~1 s, una vez): cada lóbulo se dibuja en cascada, de arriba
 * abajo.
 *
 * Animación continua (siempre): bombeo en latido doble ("lub-dub"). El
 * cerebro crece un 6 % desde el centro y vuelve, y en cada latido los dos
 * hemisferios se separan ligeramente y se juntan. Pausa corta entre
 * latidos; sin rebote. El navegador lo pausa solo con la app en segundo
 * plano.
 *
 * Solo transform y opacity, salvo el trazo de los lóbulos en la entrada
 * (strokeDashoffset, una vez). Con prefers-reduced-motion no se anima nada.
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

// Lóbulos de arriba abajo, alternando hemisferio (el orden en que se
// dibujan en la entrada). Mismos paths que el original.
const LEFT = [
  { part: "left-top", d: "M5 9.3v-2.8a3.5 3.5 0 0 1 7 0v10" },
  { part: "left-mid", d: "M6.5 16a3.5 3.5 0 0 1 0 -7h.5" },
  { part: "left-bottom", d: "M8.5 13a3.5 3.5 0 0 1 3.5 3.5v1a3.5 3.5 0 0 1 -7 0v-1.8" },
] as const

const RIGHT = [
  { part: "right-top", d: "M19 9.3v-2.8a3.5 3.5 0 0 0 -7 0" },
  { part: "right-mid", d: "M17.5 16a3.5 3.5 0 0 0 0 -7h-.5" },
  { part: "right-bottom", d: "M15.5 13a3.5 3.5 0 0 0 -3.5 3.5v1a3.5 3.5 0 0 0 7 0v-1.8" },
] as const

const CENTER = "12 12"
// Separación de cada hemisferio en el latido (unidades del viewBox).
const SPREAD = 0.35

export default function BrainAnimatedIcon({
  className = "h-5 w-5",
  strokeWidth = 2,
  delay = 0,
  onceKey,
  ...rest
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const entranceRef = useRef<gsap.core.Timeline | null>(null)

  // Entrada: los lóbulos se dibujan de arriba abajo.
  useLayoutEffect(() => {
    const svg = svgRef.current

    if (!svg) return
    if (onceKey && played.has(onceKey)) return

    return withMotion(svg, () => {
      const lobes = ["top", "mid", "bottom"].flatMap((row) => [
        svg.querySelector(`[data-part="left-${row}"]`),
        svg.querySelector(`[data-part="right-${row}"]`),
      ])

      const tl = gsap.timeline({
        delay,
        onComplete: () => {
          if (onceKey) played.add(onceKey)
        },
      })

      tl.from(lobes, {
        strokeDashoffset: 1,
        duration: 0.55,
        ease: "power2.inOut",
        stagger: 0.09,
        clearProps: "strokeDashoffset",
      })

      entranceRef.current = tl

      return () => {
        entranceRef.current = null
      }
    })
  }, [delay, onceKey])

  // Bombeo continuo, siempre.
  useEffect(() => {
    const svg = svgRef.current

    if (!svg) return

    return withMotion(svg, () => {
      const brain = svg.querySelector('[data-part="brain"]')
      const left = svg.querySelector('[data-part="left"]')
      const right = svg.querySelector('[data-part="right"]')
      const entrance = entranceRef.current
      const wait = entrance?.parent ? Math.max(0, entrance.endTime() - entrance.parent.time()) : 0

      /** Un latido: crece `scale` y separa los hemisferios `spread`, y vuelve. */
      function beat(scale: number, spread: number, up: number, down: number) {
        return gsap
          .timeline()
          .to(brain, { scale, svgOrigin: CENTER, duration: up, ease: "power2.out" }, 0)
          .to(left, { x: -spread, duration: up, ease: "power2.out" }, 0)
          .to(right, { x: spread, duration: up, ease: "power2.out" }, 0)
          .to(brain, { scale: 1, svgOrigin: CENTER, duration: down, ease: "sine.inOut" }, up)
          .to([left, right], { x: 0, duration: down, ease: "sine.inOut" }, up)
      }

      const pulse = gsap.timeline({ delay: wait + 0.2, repeat: -1, repeatDelay: 0.9 })

      // "Lub" fuerte y "dub" suave, como un latido.
      pulse.add(beat(1.06, SPREAD, 0.18, 0.28)).add(beat(1.035, SPREAD * 0.6, 0.16, 0.42), "+=0.04")

      return () => {
        pulse.kill()
        gsap.set([brain, left, right], { clearProps: "transform" })
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
      {/* pathLength=1: cada lóbulo se dibuja animando el offset de 1 a 0. */}
      <g data-part="brain">
        <g data-part="left">
          {LEFT.map((lobe) => (
            <path key={lobe.part} data-part={lobe.part} d={lobe.d} pathLength={1} strokeDasharray={1} />
          ))}
        </g>
        <g data-part="right">
          {RIGHT.map((lobe) => (
            <path key={lobe.part} data-part={lobe.part} d={lobe.d} pathLength={1} strokeDasharray={1} />
          ))}
        </g>
      </g>
    </svg>
  )
}
