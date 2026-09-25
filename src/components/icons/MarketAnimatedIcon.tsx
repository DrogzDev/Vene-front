import { useEffect, useLayoutEffect, useRef } from "react"

import { EASE, gsap, withMotion } from "../../motion/motion"

/*
 * Icono oficial de Mercado: el "chart-histogram" de Tabler, sin rediseñar
 * (src/assets/venecambio-ui-icons/chart-histogram.svg es el original).
 *
 * Partes (data-part):
 *   axis        M3 3v18h18                  ejes: vertical + línea base
 *   bar-1..4    M8/M12/M16/M20 …            barras, de izquierda a derecha
 *   trend-line  M3 11c6 0 5 -5 9 -5s3 5 9 5 curva superior
 * (El <path> invisible de 24×24 que añade Tabler se omite: no dibuja nada.)
 *
 * Entrada (~1,3 s, lenta y una vez): el eje aparece, las barras crecen
 * desde la base en cascada y la curva se dibuja de izquierda a derecha.
 *
 * Después, animación continua (siempre, sin depender del hover ni de
 * la pantalla): las barras respiran desde la base como un ecualizador
 * lento y la curva late suave. El navegador la pausa sola si la app pasa
 * a segundo plano (GSAP usa requestAnimationFrame).
 *
 * Solo transform y opacity, salvo el trazo de la curva en la entrada
 * (strokeDashoffset sobre un path de 24 px, una vez). Con
 * prefers-reduced-motion no se anima nada: ni entrada ni ciclo.
 */

type Props = {
  className?: string
  strokeWidth?: number
  /** Retraso de la entrada, para sincronizarla con la de la pantalla. */
  delay?: number
  /**
   * Si se indica, la entrada solo se reproduce la primera vez que se monta
   * un icono con esta clave en la sesión (la barra inferior se vuelve a
   * montar en cada pantalla y no debe redibujarlo cada vez).
   */
  onceKey?: string
  /** Animación continua tras la entrada. Activa por defecto. */
  loop?: boolean
}

const played = new Set<string>()

// Barras de izquierda a derecha. El SVG original las trae al revés
// (x=20, 16, 12, 8); el orden del DOM no cambia el dibujo.
const BARS = [
  { part: "bar-1", d: "M8 16v5" },
  { part: "bar-2", d: "M12 13v8" },
  { part: "bar-3", d: "M16 16v5" },
  { part: "bar-4", d: "M20 18v3" },
] as const

export default function MarketAnimatedIcon({
  className = "h-5 w-5",
  strokeWidth = 2,
  delay = 0,
  onceKey,
  loop = true,
  ...rest
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const entranceRef = useRef<gsap.core.Timeline | null>(null)

  // Entrada. Layout effect: el estado inicial se fija antes del pintado,
  // así no hay un fotograma con el icono completo antes de animar.
  useLayoutEffect(() => {
    const svg = svgRef.current

    if (!svg) return
    if (onceKey && played.has(onceKey)) return

    return withMotion(svg, () => {
      const axis = svg.querySelector('[data-part="axis"]')
      const bars = svg.querySelectorAll('[data-part^="bar-"]')
      const line = svg.querySelector('[data-part="trend-line"]')

      // Cuenta como reproducida solo al terminar: si el icono se desmonta a
      // mitad (la barra se vuelve a montar al pasar del skeleton a Inicio),
      // el siguiente montaje la repite entera en vez de quedarse cortada.
      const tl = gsap.timeline({
        delay,
        defaults: { ease: EASE.out },
        onComplete: () => {
          if (onceKey) played.add(onceKey)
        },
      })

      tl.from(axis, { opacity: 0, duration: 0.4, clearProps: "opacity" }, 0)
        .from(
          bars,
          {
            scaleY: 0,
            opacity: 0,
            transformOrigin: "50% 100%",
            duration: 0.55,
            stagger: 0.12,
            ease: EASE.strong,
            clearProps: "transform,opacity",
          },
          0.15,
        )
        .from(
          line,
          { strokeDashoffset: 1, opacity: 0, duration: 0.7, ease: "power2.inOut", clearProps: "strokeDashoffset,opacity" },
          0.6,
        )

      entranceRef.current = tl

      return () => {
        entranceRef.current = null
      }
    })
  }, [delay, onceKey])

  // Animación continua: el icono está SIEMPRE en movimiento (no depende
  // del hover ni de la pantalla). Arranca cuando termina la entrada que
  // haya en curso; si no hubo entrada (ya vista), arranca enseguida.
  //
  // Cada barra "respira" desde la base como un ecualizador lento: baja a
  // una altura distinta y vuelve a la original (scaleY ≤ 1, así nunca
  // supera el dibujo del SVG). La curva late suave de opacidad. Todo en
  // yoyo infinito sin pausas, con desfase entre barras.
  useEffect(() => {
    const svg = svgRef.current

    if (!svg || !loop) return

    return withMotion(svg, () => {
      const bars = gsap.utils.toArray<SVGPathElement>(svg.querySelectorAll('[data-part^="bar-"]'))
      const line = svg.querySelector('[data-part="trend-line"]')
      const entrance = entranceRef.current
      const wait = entrance?.parent ? Math.max(0, entrance.endTime() - entrance.parent.time()) : 0

      // Altura mínima de cada barra en el ciclo (1 = altura original).
      const LOW = [0.55, 0.7, 0.5, 0.65]

      const tweens = bars.map((bar, index) =>
        gsap.to(bar, {
          scaleY: LOW[index] ?? 0.6,
          transformOrigin: "50% 100%",
          duration: 1.1 + index * 0.12,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: wait + index * 0.22,
        }),
      )

      tweens.push(
        gsap.to(line, {
          opacity: 0.5,
          duration: 1.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: wait + 0.3,
        }),
      )

      // Al desmontar, el icono vuelve a su estado exacto.
      return () => {
        tweens.forEach((tween) => tween.kill())
        gsap.set(bars, { clearProps: "transform" })
        gsap.set(line, { clearProps: "opacity" })
      }
    })
  }, [loop])

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
      <path data-part="axis" d="M3 3v18h18" />
      {BARS.map((bar) => (
        <path key={bar.part} data-part={bar.part} d={bar.d} />
      ))}
      {/* pathLength=1 normaliza el trazo: la curva se dibuja animando el
          offset de 1 a 0 sin medir su longitud real. */}
      <path data-part="trend-line" d="M3 11c6 0 5 -5 9 -5s3 5 9 5" pathLength={1} strokeDasharray={1} />
    </svg>
  )
}
