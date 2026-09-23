import { useRef } from "react"
import type { ReactNode } from "react"

import { usePageEntrance } from "../../motion/usePageEntrance"
import BottomNavigation from "./BottomNavigation"

type Props = {
  children: ReactNode
  /**
   * Ancho del contenido. "app" es la columna de móvil, que en escritorio
   * se queda centrada; "wide" deja que la pantalla de mercado use el
   * espacio horizontal para poner el panel lateral junto al gráfico.
   */
  width?: "app" | "wide"
  /** Oculta la navegación inferior (pantalla completa del gráfico). */
  hideNav?: boolean
}

const WIDTHS = {
  app: "max-w-[520px]",
  wide: "max-w-[520px] lg:max-w-[1120px]",
} as const

/**
 * Marco común de todas las pantallas.
 *
 * - La barra de estado se respeta con --sat (ver index.css): en Android
 *   15 el WebView es edge-to-edge y env() puede valer 0.
 * - El padding inferior reserva la navegación + la safe area, así la
 *   última tarjeta nunca queda debajo de la barra.
 * - La cabecera (AppHeader) es sticky y se pega justo bajo la barra de
 *   estado; por eso aquí el padding superior es solo la safe area.
 * - Entrada de pantalla sutil (fade + 6 px, ~240 ms) al navegar. Si la
 *   pantalla marca bloques con `data-enter`, entran en cascada. Nada de
 *   slides laterales.
 */
export default function AppShell({
  children,
  width = "app",
  hideNav = false,
}: Props) {
  const contentRef = useRef<HTMLDivElement | null>(null)

  usePageEntrance(contentRef)

  return (
    <div className="relative min-h-dvh bg-bg text-ink">
      {/* Franja fija bajo la barra de estado: el contenido que pasa por
          debajo al hacer scroll no se mezcla con el reloj ni los iconos. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-30 bg-bg"
        style={{ height: "var(--sat)" }}
      />

      <div
        ref={contentRef}
        className={`mx-auto w-full px-4 sm:px-5 ${WIDTHS[width]}`}
        style={{
          paddingTop: "var(--sat)",
          paddingBottom: hideNav
            ? "calc(1rem + var(--sab))"
            : "calc(var(--nav-h) + 1.75rem + var(--sab))",
        }}
      >
        {children}
      </div>

      {!hideNav && <BottomNavigation />}
    </div>
  )
}
