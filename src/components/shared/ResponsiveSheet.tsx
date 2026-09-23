import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"

import { DUR, EASE, MOTION_OK, gsap, prefersReducedMotion } from "../../motion/motion"
import { CloseIcon } from "../priceHistory/icons"

/** Desde `sm` el sheet es un panel lateral; en móvil sube desde abajo. */
const DESKTOP = "(min-width: 640px)"

type Props = {
  open: boolean
  onClose: () => void
  /** Icono pequeño junto al título (ej. SparkleIcon). */
  icon?: ReactNode
  title: string
  subtitle?: string
  /** Etiqueta accesible del diálogo; por defecto usa `title`. */
  ariaLabel?: string
  footer?: ReactNode
  children: ReactNode
}

/**
 * Contenedor compartido para paneles de detalle: bottom sheet en
 * móvil, panel lateral derecho a partir de `sm`. Lo usan tanto el
 * análisis IA del historial de precios como el del mercado P2P, para
 * no mantener dos veces el mismo cristal, animación y manejo de foco.
 *
 * Se monta en un portal sobre <body>: así ningún transform de la página
 * (la entrada de pantalla) puede desencajar su `position: fixed`.
 *
 * Movimiento (GSAP): el overlay aparece con un fade y el panel sube
 * (yPercent 100 → 0, ~0,3 s) o, en escritorio, entra 24 px desde la
 * derecha. Al cerrar se anima la salida y solo después se desmonta. Con
 * reduced-motion, solo un fundido corto.
 */
export default function ResponsiveSheet({
  open,
  onClose,
  icon,
  title,
  subtitle,
  ariaLabel,
  footer,
  children,
}: Props) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const overlayRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // Sigue montado mientras dura la animación de salida.
  const [mounted, setMounted] = useState(open)

  if (open && !mounted) setMounted(true)

  // Entrada.
  useLayoutEffect(() => {
    const overlay = overlayRef.current
    const panel = panelRef.current

    if (!open || !mounted || !overlay || !panel) return

    const mm = gsap.matchMedia()

    mm.add({ full: MOTION_OK, desktop: DESKTOP }, (context) => {
      const { full, desktop } = context.conditions as { full: boolean; desktop: boolean }

      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: full ? DUR.base : 0.12, ease: EASE.out })

      if (!full) {
        gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.12, clearProps: "opacity" })
      } else if (desktop) {
        gsap.fromTo(
          panel,
          { x: 24, opacity: 0 },
          { x: 0, opacity: 1, duration: DUR.sheet, ease: EASE.strong, clearProps: "transform,opacity" },
        )
      } else {
        gsap.fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: DUR.sheet, ease: EASE.strong, clearProps: "transform" })
      }
    })

    return () => mm.revert()
  }, [open, mounted])

  // Salida: se anima y después se desmonta.
  useEffect(() => {
    const overlay = overlayRef.current
    const panel = panelRef.current

    if (open || !mounted) return

    const reduced = prefersReducedMotion()
    const desktop = window.matchMedia(DESKTOP).matches

    const timeline = gsap.timeline({ onComplete: () => setMounted(false) })

    if (overlay) timeline.to(overlay, { opacity: 0, duration: reduced ? 0.1 : 0.2, ease: EASE.out }, 0)

    if (panel) {
      timeline.to(
        panel,
        reduced
          ? { opacity: 0, duration: 0.1 }
          : desktop
            ? { x: 24, opacity: 0, duration: 0.2, ease: EASE.in }
            : { yPercent: 100, duration: 0.22, ease: EASE.in },
        0,
      )
    }

    return () => {
      timeline.kill()
    }
  }, [open, mounted])

  // Cerrar con Escape y llevar el foco al botón de cerrar al abrirlo.
  useEffect(() => {
    if (!open) return

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", handleKey)
    closeButtonRef.current?.focus()

    return () => {
      document.removeEventListener("keydown", handleKey)
    }
  }, [open, onClose])

  // Bloquear el scroll del fondo mientras el sheet está abierto.
  useEffect(() => {
    if (!open) return

    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!mounted) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-end ${
        open ? "" : "pointer-events-none"
      }`}
    >
      <button
        ref={overlayRef}
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-card border border-hair bg-surface shadow-[0_-16px_50px_rgba(0,0,0,0.5)] sm:h-full sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-card sm:border-y-0 sm:border-r-0"
        style={{
          paddingBottom: "var(--sab)",
        }}
      >
        {/* Asa del bottom sheet, solo en móvil. */}
        <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden>
          <span className="h-1 w-9 rounded-full bg-white/15" />
        </div>

        <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-3 sm:pt-5">
          <div className="flex min-w-0 items-center gap-2">
            {icon}
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-ink">{title}</h2>
              {subtitle && <p className="truncate text-[11px] text-ink-faint">{subtitle}</p>}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-muted outline-none transition hover:bg-surface-raised hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-95"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-between gap-3 border-t border-hair px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
