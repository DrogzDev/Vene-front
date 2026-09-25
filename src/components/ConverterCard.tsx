import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ArrowDownUp, Check, Copy, RefreshCw } from "lucide-react"

import { EASE, gsap, withMotion } from "../motion/motion"
import { formatBs, formatRelativeFromNow } from "../utils/format"
import CurrencyBadge from "./ui/CurrencyBadge"
import type { CurrencyCode } from "./ui/CurrencyBadge"
import { IconButton } from "./ui/primitives"
import SlingButton from "./ui/SlingButton"
import { CUSTOM_RATE_STORAGE_KEY } from "./converterModes"
import type { ConverterMode, ConverterRates } from "./converterModes"

type Props = ConverterRates & {
  mode: ConverterMode
  /** Momento de las tasas, para "Actualizado hace X". */
  updatedAt?: string | null
  /** Refresca las tasas en vivo (junto al botón de copiar). */
  onRefresh?: () => void
  refreshing?: boolean
}

/** Moneda de origen de cada tasa (el Promedio también se expresa en USD). */
function currencyOf(mode: ConverterMode): CurrencyCode {
  if (mode === "EUR") return "EUR"
  if (mode === "USDT") return "USDT"
  if (mode === "CUSTOM") return "DIV"
  return "USD"
}

function Side({
  label,
  contentRef,
  children,
}: {
  label: string
  contentRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}) {
  return (
    <div className="px-4 pb-3.5 pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <div ref={contentRef} className="mt-2 flex items-center gap-3">
        {children}
      </div>
    </div>
  )
}

/**
 * Calculadora de divisas instantánea: DE → A.
 *
 * La conversión ocurre al teclear, así que no hay botón "Convertir"; el
 * resultado es el protagonista y se puede copiar con un toque. Se puede
 * invertir el sentido (bolívares → divisa) con el botón central.
 *
 * Movimiento: al invertir, el icono del botón gira 180° y el contenido
 * de cada fila entra desde el lado contrario (lo de arriba "baja", lo de
 * abajo "sube"). Al cambiar de tasa solo se refrescan iconos, etiquetas
 * y resultado. La card nunca rota ni se mueve entera.
 */
export default function ConverterCard({
  usdRate,
  eurRate,
  usdtRate,
  averageRate,
  mode,
  updatedAt,
  onRefresh,
  refreshing = false,
}: Props) {
  const [amount, setAmount] = useState("1")
  const [copied, setCopied] = useState(false)

  // Inicialización perezosa: el primer render ya trae la tasa guardada.
  const [customRate, setCustomRate] = useState(() => {
    try {
      return localStorage.getItem(CUSTOM_RATE_STORAGE_KEY) ?? ""
    } catch {
      return ""
    }
  })

  /** false: divisa → Bs. true: Bs → divisa. */
  const [inverted, setInverted] = useState(false)

  const cardRef = useRef<HTMLElement | null>(null)
  const fromRef = useRef<HTMLDivElement | null>(null)
  const toRef = useRef<HTMLDivElement | null>(null)
  const rateLineRef = useRef<HTMLParagraphElement | null>(null)
  const previous = useRef({ inverted, mode })

  // Swap o cambio de tasa: se anima solo el contenido que cambió.
  useLayoutEffect(() => {
    const last = previous.current
    previous.current = { inverted, mode }

    const swapped = last.inverted !== inverted
    const rateChanged = last.mode !== mode

    if (!swapped && !rateChanged) return

    const from = fromRef.current
    const to = toRef.current
    const rateLine = rateLineRef.current

    if (!from || !to) return

    return withMotion(cardRef.current, () => {
      const settle = { y: 0, opacity: 1, duration: 0.22, ease: EASE.out, clearProps: "opacity,transform" }

      if (swapped) {
        // Lo que estaba abajo sube a DE; lo que estaba arriba baja a A.
        gsap.fromTo(from, { y: 8, opacity: 0 }, settle)
        gsap.fromTo(to, { y: -8, opacity: 0 }, settle)
        return
      }

      gsap.fromTo(rateLine ? [from, to, rateLine] : [from, to], { y: 4, opacity: 0 }, { ...settle, duration: 0.2, stagger: 0.03 })
    })
  }, [inverted, mode])

  function swap() {
    setInverted((value) => !value)
  }

  useEffect(() => {
    // Solo se persiste una tasa escrita de verdad.
    if (customRate) {
      localStorage.setItem(CUSTOM_RATE_STORAGE_KEY, customRate)
    }
  }, [customRate])

  const rate = useMemo(() => {
    if (mode === "USD") return usdRate
    if (mode === "EUR") return eurRate
    if (mode === "USDT") return usdtRate
    if (mode === "AVERAGE") return averageRate

    const parsed = Number(customRate)

    return parsed > 0 ? parsed : 0
  }, [mode, usdRate, eurRate, usdtRate, averageRate, customRate])

  const numericAmount = Number(amount) || 0
  const result = inverted ? (rate > 0 ? numericAmount / rate : 0) : numericAmount * rate

  const foreign = currencyOf(mode)
  const from: CurrencyCode = inverted ? "VES" : foreign
  const to: CurrencyCode = inverted ? foreign : "VES"
  const unitName = foreign === "DIV" ? "divisa" : foreign

  const resultText = `${to === "VES" ? "Bs " : ""}${formatBs(result)}`

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(formatBs(result))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section ref={cardRef} aria-label="Conversor" className="overflow-hidden rounded-card border border-hair bg-surface">
      <Side label="De" contentRef={fromRef}>
        <CurrencyBadge code={from} />
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-label={`Cantidad en ${from === "VES" ? "bolívares" : unitName}`}
          placeholder="0"
          className="min-w-0 flex-1 bg-transparent text-right text-[27px] font-bold tabular-nums text-ink-soft outline-none placeholder:text-ink-faint focus:text-ink"
        />
      </Side>

      {/* Separador con el botón de invertir encima: arrastrar y soltar lo
          dispara con una animación de resortera (SlingButton); un simple
          toque lo invierte al instante igual que antes. */}
      <div className="relative mx-3.5 h-px bg-hair">
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <SlingButton
            onSend={swap}
            ariaLabel="Invertir el sentido de la conversión"
            size={40}
            padColor="rgb(var(--c-surface-2))"
            iconColor="rgb(var(--c-gold-ink))"
            accentColor="rgb(var(--c-gold))"
            wellColor="rgb(var(--c-surface-1))"
            bandColor="rgb(var(--c-border-default))"
            axis="horizontal"
            maxPull={90}
            armAt={30}
            flight={55}
            particles={10}
            spread={45}
          >
            <ArrowDownUp className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </SlingButton>
        </div>
      </div>

      <Side label="A" contentRef={toRef}>
        <CurrencyBadge code={to} />
        <p
          aria-live="polite"
          className="min-w-0 flex-1 truncate text-right text-[clamp(31px,9.2vw,39px)] font-extrabold tracking-tight tabular-nums text-ink"
        >
          {resultText}
        </p>
      </Side>

      {/* "1 unidad = Bs X" es redundante: el resultado ya es el
          protagonista de la fila "A" de arriba (con cantidad = 1, son el
          mismo número). Solo queda aquí el aviso cuando falta escribir
          una tasa personalizada; la antigüedad de la tasa se muestra
          junto al botón de actualizar, que es donde de verdad sirve. */}
      <div className="flex items-center justify-between gap-3 border-t border-hair bg-bg-soft/60 py-1.5 pl-3.5 pr-2">
        <p ref={rateLineRef} className="min-w-0 truncate text-[12px] text-ink-muted">
          {rate > 0 ? null : "Escribe una tasa para convertir."}
        </p>

        <span className="flex shrink-0 items-center gap-2">
          {updatedAt && mode !== "CUSTOM" && (
            <span className="whitespace-nowrap text-[11px] text-ink-faint">{formatRelativeFromNow(updatedAt)}</span>
          )}

          {onRefresh && (
            <IconButton label={refreshing ? "Actualizando tasas" : "Actualizar tasas"} onClick={onRefresh} disabled={refreshing}>
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "motion-safe:animate-spin" : ""}`}
                strokeWidth={2.2}
                aria-hidden
              />
            </IconButton>
          )}

          <IconButton
            label={copied ? "Resultado copiado" : "Copiar resultado"}
            onClick={copyResult}
            disabled={rate <= 0}
            active={copied}
          >
            {copied ? (
              <Check className="h-4 w-4 text-up" strokeWidth={2.4} aria-hidden />
            ) : (
              <Copy className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            )}
          </IconButton>
        </span>
      </div>

      {mode === "CUSTOM" && (
        <div className="border-t border-hair px-3.5 py-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Tasa personalizada (Bs por unidad)
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={customRate}
              onChange={(event) => setCustomRate(event.target.value)}
              placeholder="Ej: 72,50"
              className="mt-1.5 h-11 w-full rounded-ctl border border-hair bg-bg-soft px-3.5 text-[17px] font-semibold tabular-nums text-ink outline-none placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-brand/50"
            />
          </label>
          <p className="mt-1.5 text-[11px] text-ink-faint">Esta tasa se guarda en la app.</p>
        </div>
      )}
    </section>
  )
}
