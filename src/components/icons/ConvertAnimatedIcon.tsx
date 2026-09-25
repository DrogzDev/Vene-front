import { useEffect, useLayoutEffect, useRef } from "react"

import { EASE, gsap, prefersReducedMotion, withMotion } from "../../motion/motion"

/*
 * Icono oficial de Convertir: el "arrows-left-right" de Tabler, sin
 * rediseñar (src/assets/venecambio-ui-icons/arrows-left-right.svg es el
 * original).
 *
 * Partes (data-part):
 *   arrow-top     M3 7l18 0  +  M6 10l-3 -3l3 -3    apunta a la IZQUIERDA
 *   arrow-bottom  M21 17l-18 0  +  M18 20l3 -3l-3 -3  apunta a la DERECHA
 * (El <path> invisible de 24×24 que añade Tabler se omite.)
 *
 * Entrada (~0,8 s, una vez): cada flecha llega desde su lado.
 *
 * Animación continua (siempre): cada flecha toma impulso hacia atrás,
 * sale disparada hacia donde apunta desvaneciéndose, reaparece desde
 * atrás y vuelve a su sitio. Las dos flechas van desfasadas. El navegador
 * la pausa sola con la app en segundo plano.
 *
 * Toque / click: las flechas dan un giro circular de 180° alrededor del
 * centro, como si intercambiaran su lugar. El icono es simétrico, así que
 * al terminar queda idéntico y el ciclo continúa sin saltos. Como tocar
 * Convertir navega, la pantalla nueva no llegaría a verlo: el giro se
 * "pasa" al icono de la barra inferior (spinOnArrive) que monta la
 * pantalla de destino.
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
  /** Si hubo un toque en otro Convertir justo antes, gira al montarse. */
  spinOnArrive?: boolean
}

const played = new Set<string>()

// Momento del último toque en cualquier icono de Convertir. El icono de
// la pantalla siguiente gira si se monta poco después.
let lastSpinRequest = 0
const SPIN_HANDOFF_MS = 2500

// Distancias en unidades del viewBox (24): impulso corto hacia atrás y
// salida hacia el frente. `dir` es hacia dónde apunta cada flecha.
const BACK = 2.5
const OUT = 9

export default function ConvertAnimatedIcon({
  className = "h-5 w-5",
  strokeWidth = 2,
  delay = 0,
  onceKey,
  spinOnArrive = false,
  ...rest
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const entranceRef = useRef<gsap.core.Timeline | null>(null)
  const loopRef = useRef<gsap.core.Timeline | null>(null)

  // Entrada: cada flecha llega desde el lado contrario al que apunta.
  useLayoutEffect(() => {
    const svg = svgRef.current

    if (!svg) return
    if (onceKey && played.has(onceKey)) return

    return withMotion(svg, () => {
      const top = svg.querySelector('[data-part="arrow-top"]')
      const bottom = svg.querySelector('[data-part="arrow-bottom"]')

      const tl = gsap.timeline({
        delay,
        defaults: { duration: 0.7, ease: EASE.strong, clearProps: "transform,opacity" },
        onComplete: () => {
          if (onceKey) played.add(onceKey)
        },
      })

      tl.from(top, { x: 8, opacity: 0 }, 0).from(bottom, { x: -8, opacity: 0 }, 0.12)

      entranceRef.current = tl

      return () => {
        entranceRef.current = null
      }
    })
  }, [delay, onceKey])

  // Animación continua: impulso → salida → reaparición → a su sitio.
  useEffect(() => {
    const svg = svgRef.current

    if (!svg) return

    return withMotion(svg, () => {
      const top = svg.querySelector('[data-part="arrow-top"]')
      const bottom = svg.querySelector('[data-part="arrow-bottom"]')
      const entrance = entranceRef.current
      const wait = entrance?.parent ? Math.max(0, entrance.endTime() - entrance.parent.time()) : 0

      /** Un ciclo de una flecha. dir = -1 apunta a la izquierda, 1 a la derecha. */
      function cycle(target: Element | null, dir: 1 | -1) {
        return gsap
          .timeline()
          // Toma impulso: retrocede un poco, lento.
          .to(target, { x: -dir * BACK, duration: 0.55, ease: "sine.inOut" })
          // Sale disparada hacia su frente y se desvanece.
          .to(target, { x: dir * OUT, opacity: 0, duration: 0.45, ease: "power2.in" })
          // Reaparece desde atrás…
          .set(target, { x: -dir * OUT })
          // …y vuelve a su sitio.
          .to(target, { x: 0, opacity: 1, duration: 0.75, ease: EASE.strong })
      }

      const loop = gsap.timeline({ delay: wait + 0.3, repeat: -1, repeatDelay: 0.9 })

      loop.add(cycle(top, -1), 0).add(cycle(bottom, 1), 0.28)
      loopRef.current = loop

      return () => {
        loop.kill()
        loopRef.current = null
        gsap.set([top, bottom], { clearProps: "transform,opacity" })
      }
    })
  }, [])

  // Toque / click: giro circular de 180°. También al montarse si otro
  // icono de Convertir pidió el giro justo antes de navegar.
  useEffect(() => {
    const svg = svgRef.current
    const group = svg?.querySelector('[data-part="arrows"]')
    const target = svg?.closest("button, a") ?? svg

    if (!svg || !group || !target) return

    let spin: gsap.core.Timeline | null = null

    function play() {
      if (prefersReducedMotion() || spin?.isActive()) return

      const loop = loopRef.current
      const arrows = svg!.querySelectorAll('[data-part^="arrow-"]')

      loop?.pause()

      spin = gsap
        .timeline({
          onComplete: () => {
            // Simétrico: tras 180° el icono es idéntico; se limpia y sigue.
            gsap.set(group!, { clearProps: "transform" })
            loop?.restart(true)
            // El giro pedido ya se vio completo: ninguna otra pantalla lo
            // repite. Si el icono se desmonta a mitad (la pantalla pasa de
            // skeleton a contenido), el siguiente montaje lo hace entero.
            lastSpinRequest = 0
          },
        })
        // Las flechas vuelven a su sitio para girar el icono completo.
        .to(arrows, { x: 0, opacity: 1, duration: 0.15, ease: EASE.out }, 0)
        .to(group!, { rotation: 180, svgOrigin: "12 12", duration: 0.6, ease: "power2.inOut" }, 0.05)
    }

    function onPointerDown() {
      lastSpinRequest = performance.now()
      play()
    }

    target.addEventListener("pointerdown", onPointerDown)

    if (spinOnArrive && performance.now() - lastSpinRequest < SPIN_HANDOFF_MS) play()

    return () => {
      target.removeEventListener("pointerdown", onPointerDown)
      spin?.kill()
      gsap.set(group, { clearProps: "transform" })
    }
  }, [spinOnArrive])

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
      <g data-part="arrows">
        <g data-part="arrow-top">
          <path d="M6 10l-3 -3l3 -3" />
          <path d="M3 7l18 0" />
        </g>
        <g data-part="arrow-bottom">
          <path d="M21 17l-18 0" />
          <path d="M18 20l3 -3l-3 -3" />
        </g>
      </g>
    </svg>
  )
}
