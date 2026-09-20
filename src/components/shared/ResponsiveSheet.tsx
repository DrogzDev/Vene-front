import { useEffect, useRef } from "react"
import type { ReactNode } from "react"

import { CloseIcon } from "../priceHistory/icons"

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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 motion-safe:animate-fade-in-fast backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[20px] border border-white/[0.07] bg-[#12151c] shadow-[0_-16px_50px_rgba(0,0,0,0.5)] motion-safe:animate-sheet-up sm:h-full sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-[20px] sm:border-y-0 sm:border-r-0 sm:motion-safe:animate-panel-in"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
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
              <h2 className="truncate text-sm font-bold text-[#e9ebf0]">{title}</h2>
              {subtitle && <p className="truncate text-[11px] text-[#646d7d]">{subtitle}</p>}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#8b93a3] outline-none transition hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-between gap-3 border-t border-white/[0.05] px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
