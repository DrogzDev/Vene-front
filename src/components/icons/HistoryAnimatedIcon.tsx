import { useEffect, useLayoutEffect, useRef } from "react"

import { EASE, gsap, withMotion } from "../../motion/motion"

/*
 * Icono oficial de Historial: el "history-toggle" de Tabler, sin
 * rediseñar (src/assets/venecambio-ui-icons/history-toggle.svg es el
 * original).
 *
 * Partes (data-part):
 *   ring         M14 3.223a9.003 …       mitad derecha del reloj (un trazo)
 *   dash-1..4    arriba → abajo          trazos de la mitad izquierda
 *   hand-hour    M12 8v4                 aguja de la hora (arriba)
 *   hand-minute  M12 12l3 3              aguja de los minutos (abajo-dcha)
 * El original dibuja las dos agujas en un solo path ("M12 8v4l3 3"); se
 * parte en dos para que giren por separado. Mismos puntos y extremos
 * redondeados: el dibujo no cambia. (El <path> invisible de 24×24 de
 * Tabler se omite.)
 *
 * Entrada (~1 s, una vez): la mitad derecha se dibuja, los trazos de la
 * izquierda aparecen de arriba abajo y las agujas entran girando.
 *
 * Animación continua (siempre): las agujas giran en círculo alrededor del
 * centro (12,12), como un reloj acelerado: minutero ~4 s por vuelta,
 * horario ~24 s. Movimiento lineal y continuo; el navegador lo pausa solo
 * con la app en segundo plano.
 *
 * Solo transform y opacity, salvo el trazo del anillo en la entrada
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

// Trazos de la mitad izquierda, de arriba abajo (el SVG los trae en otro
// orden; el dibujo es el mismo).
const DASHES = [
  { part: "dash-1", d: "M6.907 4.579a8.954 8.954 0 0 1 3.093 -1.356" },
  { part: "dash-2", d: "M3.124 10.5c.16 -.95 .468 -1.85 .9 -2.675l.169 -.305" },
  { part: "dash-3", d: "M4.579 17.093a8.961 8.961 0 0 1 -1.227 -2.592" },
  { part: "dash-4", d: "M10 20.777a8.942 8.942 0 0 1 -2.48 -.969" },
] as const

const CENTER = "12 12"

export default function HistoryAnimatedIcon({
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
      const ring = svg.querySelector('[data-part="ring"]')
      const dashes = svg.querySelectorAll('[data-part^="dash-"]')
      const hands = svg.querySelectorAll('[data-part^="hand-"]')

      const tl = gsap.timeline({
        delay,
        defaults: { ease: EASE.out },
        onComplete: () => {
          if (onceKey) played.add(onceKey)
        },
      })

      tl.from(ring, { strokeDashoffset: 1, duration: 0.6, ease: "power2.inOut", clearProps: "strokeDashoffset" }, 0)
        .from(dashes, { opacity: 0, duration: 0.3, stagger: 0.09, clearProps: "opacity" }, 0.3)
        .from(
          hands,
          { rotation: -120, opacity: 0, svgOrigin: CENTER, duration: 0.7, ease: EASE.strong, clearProps: "transform,opacity" },
          0.35,
        )

      entranceRef.current = tl

      return () => {
        entranceRef.current = null
      }
    })
  }, [delay, onceKey])

  // Agujas girando en círculo, siempre.
  useEffect(() => {
    const svg = svgRef.current

    if (!svg) return

    return withMotion(svg, () => {
      const hour = svg.querySelector('[data-part="hand-hour"]')
      const minute = svg.querySelector('[data-part="hand-minute"]')
      const entrance = entranceRef.current
      const wait = entrance?.parent ? Math.max(0, entrance.endTime() - entrance.parent.time()) : 0

      const spin = (target: Element | null, seconds: number) =>
        gsap.to(target, {
          rotation: "+=360",
          svgOrigin: CENTER,
          duration: seconds,
          ease: "none",
          repeat: -1,
          delay: wait + 0.2,
        })

      const tweens = [spin(minute, 4), spin(hour, 24)]

      return () => {
        tweens.forEach((tween) => tween.kill())
        gsap.set([hour, minute], { clearProps: "transform" })
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
      {/* pathLength=1: el anillo se dibuja animando el offset de 1 a 0. */}
      <path data-part="ring" d="M14 3.223a9.003 9.003 0 0 1 0 17.554" pathLength={1} strokeDasharray={1} />
      {DASHES.map((dash) => (
        <path key={dash.part} data-part={dash.part} d={dash.d} />
      ))}
      <path data-part="hand-hour" d="M12 8v4" />
      <path data-part="hand-minute" d="M12 12l3 3" />
    </svg>
  )
}
