import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { X } from "lucide-react"

import { IconButton } from "./primitives"

/** Alto útil del gráfico a pantalla completa. */
function useFullscreenHeight(open: boolean) {
  const [height, setHeight] = useState(360)

  useEffect(() => {
    if (!open) return

    function update() {
      setHeight(Math.max(320, window.innerHeight - 130))
    }

    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [open])

  return height
}

/**
 * Gráfico a pantalla completa (Historial y Mercado). Bloquea el scroll
 * del fondo, cierra con Escape y respeta las safe areas. Recibe una
 * función que pinta el gráfico con el alto disponible.
 */
export default function FullscreenChart({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: (height: number) => ReactNode
}) {
  const height = useFullscreenHeight(open)

  useEffect(() => {
    if (!open) return

    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", handleKey)

    return () => {
      document.body.style.overflow = previous
      document.removeEventListener("keydown", handleKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex flex-col bg-bg motion-safe:animate-fade-in-fast">
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-ink">{title}</p>
          {subtitle && <p className="truncate text-[12px] text-ink-muted">{subtitle}</p>}
        </div>

        <IconButton label="Cerrar gráfico ampliado" onClick={onClose}>
          <X className="h-5 w-5" strokeWidth={2.2} aria-hidden />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 px-2" style={{ paddingBottom: "calc(0.5rem + var(--sab))" }}>
        {children(height)}
      </div>
    </div>
  )
}
