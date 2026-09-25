import { useLayoutEffect, useRef } from "react"

import { DUR, EASE, gsap, prefersReducedMotion } from "../../motion/motion"
import { formatBs } from "../../utils/format"

type Props = {
  value: number | null | undefined
  size?: "xl" | "lg" | "md"
  className?: string
}

const SIZE_CLASS = {
  xl: "text-[clamp(36px,11.5vw,46px)]",
  lg: "text-[clamp(28px,8.5vw,34px)]",
  md: "text-[22px]",
} as const

/**
 * Color de un token del tema actual como rgba() real. GSAP interpola
 * colores concretos; con un var(--…) saltaría sin transición.
 */
function tokenRgba(name: "positive" | "negative", alpha: number) {
  const channels = getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim().split(/\s+/)

  return channels.length === 3 ? `rgba(${channels.join(", ")}, ${alpha})` : `rgba(0, 0, 0, 0)`
}

function isPrice(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value)
}

function display(value: number | null | undefined) {
  return isPrice(value) ? formatBs(value) : "—"
}

/**
 * Precio protagonista con feedback de actualización.
 *
 * Cuando el MISMO precio cambia (nueva captura, refresco), el fondo hace
 * un destello verde si sube o rojo si baja (convención del mercado), y
 * la cifra recorre del valor
 * anterior al nuevo en ~0,5 s. Cada paso intermedio se redondea a
 * céntimos y se formatea como "963,50": nunca aparece 963.4999998. El
 * último fotograma escribe el valor exacto.
 *
 * El número se escribe directamente en el nodo (sin estado de React), así
 * la interpolación no re-renderiza la pantalla en cada fotograma. Por eso
 * el <span> de la cifra no tiene hijos de React: si los tuviera, React y
 * GSAP se pelearían por el mismo nodo de texto.
 *
 * Para mostrar OTRA tasa (cambiar de USD a USDT), el padre remonta el
 * componente con `key`: así no se "anima" de una tasa a otra.
 */
export default function AnimatedPrice({ value, size = "lg", className = "" }: Props) {
  const wrapperRef = useRef<HTMLParagraphElement | null>(null)
  const numberRef = useRef<HTMLSpanElement | null>(null)
  const previousRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const numberNode = numberRef.current
    const wrapper = wrapperRef.current

    if (!numberNode || !wrapper) return

    const from = previousRef.current
    const finalText = display(value)

    previousRef.current = isPrice(value) ? value : null

    const shouldAnimate = from !== null && isPrice(value) && from !== value && !prefersReducedMotion()

    if (!shouldAnimate) {
      numberNode.textContent = finalText
      return
    }

    const rising = value > from
    const proxy = { value: from }

    const counter = gsap.to(proxy, {
      value,
      duration: 0.5,
      ease: EASE.out,
      onUpdate: () => {
        numberNode.textContent = formatBs(Math.round(proxy.value * 100) / 100)
      },
      onComplete: () => {
        numberNode.textContent = finalText
      },
    })

    const flash = gsap.fromTo(
      wrapper,
      { backgroundColor: tokenRgba(rising ? "positive" : "negative", 0.16) },
      { backgroundColor: tokenRgba(rising ? "positive" : "negative", 0), duration: DUR.flash, ease: "power1.out", clearProps: "backgroundColor" },
    )

    return () => {
      counter.kill()
      flash.kill()
      gsap.set(wrapper, { clearProps: "backgroundColor" })
      numberNode.textContent = finalText
    }
  }, [value])

  return (
    <p
      ref={wrapperRef}
      className={`-mx-1.5 inline-block rounded-lg px-1.5 font-bold leading-none tracking-[-0.03em] tabular-nums text-ink ${SIZE_CLASS[size]} ${className}`}
    >
      <span className="mr-1.5 text-[0.48em] font-medium tracking-normal text-ink-muted">Bs</span>
      <span ref={numberRef} />
    </p>
  )
}
