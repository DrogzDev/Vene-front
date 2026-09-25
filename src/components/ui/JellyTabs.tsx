import { forwardRef, useEffect, useLayoutEffect, useRef } from "react"
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react"
import { animate, motion, motionValue, useReducedMotion, useTransform } from "motion/react"

import "./JellyTabs.css"

/**
 * Excepción deliberada y acotada al convenio GSAP-only del proyecto (ver
 * src/motion/motion.ts), igual que SlingButton.tsx: el "jelly swell" —
 * cada chip vecino se aparta con su propio resorte, sin animación por
 * frames — no se traduce bien a GSAP puro. Adaptado de JellyRadio
 * (React Bits) a las opciones {key,label} y los tokens de color de
 * VeneCambio; mismo API que ChipScroller (options/value/onChange) para
 * poder sustituirlo donde haga falta ese "glow" dorado en el chip activo.
 */

type ChipOption<T extends string> = { key: T; label: string }

const SIZES = { sm: [32, 12, 14], md: [36, 13, 16] } as const

// Física fija: este componente no expone las perillas de JellyRadio
// como props porque solo tiene un uso hoy (Convertir) — se ajustan aquí
// mismo si algún día hace falta variarlas por instancia.
const SWELL = 0.22
const BARGE = 5
const SHRINK = 0.06
const JELLY = 1
const BOUNCE = 0.25
const STAGGER = 18
const STIFFNESS = 560

function spring(k: number, m: number, bounce: number) {
  return {
    type: "spring" as const,
    stiffness: k,
    damping: 2 * Math.sqrt(k * m) * (1 - bounce),
    mass: m,
  }
}

type Mv = {
  x: ReturnType<typeof motionValue<number>>
  sx: ReturnType<typeof motionValue<number>>
  sy: ReturnType<typeof motionValue<number>>
}

type ChipProps = {
  mv: Mv
  className: string
  "aria-checked": boolean
  "data-on": "true" | "false"
  tabIndex: number
  onClick: () => void
  onKeyDown: (event: ReactKeyboardEvent) => void
  children: ReactNode
}

const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip({ mv, children, ...rest }, ref) {
  const transform = useTransform(() => `translateX(${mv.x.get()}px) scale(${mv.sx.get()}, ${mv.sy.get()})`)

  return (
    <motion.button ref={ref} type="button" role="radio" style={{ transform }} {...rest}>
      {children}
    </motion.button>
  )
})

export function JellyTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className = "",
}: {
  options: ChipOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  /** "sm": chips compactos, para filas secundarias (igual que ChipScroller). */
  size?: "sm" | "md"
  className?: string
}) {
  const at = Math.max(0, options.findIndex((option) => option.key === value))
  const reduce = useReducedMotion()

  const groupRef = useRef<HTMLDivElement | null>(null)
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])
  const widths = useRef<number[]>([])
  const mvs = useRef<(Mv | undefined)[]>([])
  const applied = useRef(at)

  const [h, font, px] = SIZES[size]

  const mvFor = (i: number): Mv => {
    let mv = mvs.current[i]

    if (!mv) {
      mv = { x: motionValue(0), sx: motionValue(1), sy: motionValue(1) }
      mvs.current[i] = mv
    }

    return mv
  }

  const apply = (sel: number, instant: boolean) => {
    const group = groupRef.current
    const rtl = group ? getComputedStyle(group).direction === "rtl" : false
    const push = ((widths.current[sel] ?? 0) * SWELL) / 2 + BARGE

    for (let i = 0; i < options.length; i++) {
      const mv = mvFor(i)
      const on = i === sel
      const far = Math.abs(i - sel)
      const dir = Math.sign(i - sel) * (rtl ? -1 : 1)
      const x = dir * push
      const s = on ? 1 + SWELL : 1 - SHRINK

      if (instant || reduce) {
        mv.x.jump(x)
        mv.sx.jump(s)
        mv.sy.jump(s)
        continue
      }

      const k = STIFFNESS * (1 - 0.12 * Math.min(far, 3))
      const inFlight = mv.x.isAnimating() || mv.sx.isAnimating() || mv.sy.isAnimating()
      const delay = inFlight ? 0 : (far * STAGGER) / 1000

      animate(mv.x, x, { ...spring(k, 0.9, BOUNCE), delay })
      animate(mv.sx, s, {
        ...spring(k * (1 + 0.24 * JELLY), 0.9 - 0.1 * JELLY, Math.min(0.85, BOUNCE + 0.3 * JELLY)),
        delay,
      })
      animate(mv.sy, s, { ...spring(k * (1 - 0.14 * JELLY), 0.9 + 0.05 * JELLY, BOUNCE), delay: delay + 0.05 * JELLY })
    }
  }

  const measure = () => {
    const group = groupRef.current

    if (!group) return

    widths.current = chipRefs.current.map((el) => el?.offsetWidth ?? 0)
    const chipH = chipRefs.current[0]?.offsetHeight ?? 0
    const maxW = Math.max(0, ...widths.current)

    group.style.setProperty("--jt-pad-x", `${Math.ceil((maxW * SWELL * 1.3) / 2 + BARGE) + 2}px`)
    group.style.setProperty("--jt-pad-y", `${Math.ceil((chipH * SWELL) / 2) + 2}px`)
  }

  const optionsKey = options.map((option) => option.key).join("|")

  useLayoutEffect(() => {
    const settle = () => {
      measure()
      apply(applied.current, true)
    }

    settle()

    const observer = new ResizeObserver(settle)
    if (groupRef.current) observer.observe(groupRef.current)
    document.fonts?.ready.then(settle)

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey, size])

  useEffect(() => {
    if (applied.current === at) return

    applied.current = at
    apply(at, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at])

  useEffect(
    () => () => {
      mvs.current.forEach((mv) => {
        mv?.x.destroy()
        mv?.sx.destroy()
        mv?.sy.destroy()
      })
    },
    [],
  )

  const commit = (i: number) => {
    if (i === at) return

    applied.current = i
    apply(i, false)
    onChange(options[i].key)
  }

  const stepFrom = (i: number, dir: number) => (i + dir + options.length) % options.length

  const onKeyDown = (event: ReactKeyboardEvent, i: number) => {
    let next: number | null = null

    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = stepFrom(i, 1)
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = stepFrom(i, -1)
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = options.length - 1

    if (next === null) return

    event.preventDefault()
    commit(next)
    chipRefs.current[next]?.focus()
  }

  const style: CSSProperties & Record<`--${string}`, string> = {
    "--jt-gap": "6px",
    "--jt-radius": "9999px",
    "--jt-h": `${h}px`,
    "--jt-font": `${font}px`,
    "--jt-px": `${px}px`,
  }

  return (
    <div ref={groupRef} role="radiogroup" aria-label={label} className={`jelly-tabs ${className}`} style={style}>
      {options.map((option, i) => (
        <Chip
          key={option.key}
          mv={mvFor(i)}
          ref={(el) => {
            chipRefs.current[i] = el
          }}
          aria-checked={i === at}
          tabIndex={i === at ? 0 : -1}
          className="jelly-tabs__chip"
          data-on={i === at ? "true" : "false"}
          onClick={() => commit(i)}
          onKeyDown={(event) => onKeyDown(event, i)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  )
}
