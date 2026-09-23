import { useLayoutEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowLeftRight, ChartCandlestick, History, House, Menu } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { DUR, EASE, gsap, withMotion } from "../../motion/motion"

type Item = {
  to: string
  label: string
  icon: LucideIcon
}

const LEFT: Item[] = [
  { to: "/", label: "Inicio", icon: House },
  { to: "/usdt-analisis", label: "Mercado", icon: ChartCandlestick },
]

const RIGHT: Item[] = [
  { to: "/historial", label: "Historial", icon: History },
  { to: "/mas", label: "Más", icon: Menu },
]

const CONVERT_ROUTE = "/convertir"

function isActive(pathname: string, to: string) {
  return pathname === to || (to !== "/" && pathname.startsWith(`${to}/`))
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: Item
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-ctl outline-none focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-95"
    >
      <span className="relative flex h-7 w-12 items-center justify-center">
        {/* Fondo del ítem activo. */}
        {active && <span data-nav-pill aria-hidden className="absolute inset-0 rounded-full bg-brand/15" />}
        <Icon
          data-nav-icon={active ? "" : undefined}
          className={`relative h-[22px] w-[22px] transition-colors duration-200 ${
            active ? "text-brand-light" : "text-ink-faint"
          }`}
          strokeWidth={active ? 2.3 : 1.9}
          aria-hidden
        />
      </span>
      <span
        data-nav-label={active ? "" : undefined}
        className={`max-w-full truncate px-0.5 text-[11px] font-semibold leading-none transition-colors duration-200 ${
          active ? "text-brand-light" : "text-ink-faint"
        }`}
      >
        {item.label}
      </span>
    </button>
  )
}

/**
 * Navegación inferior fija: 64 px + safe area.
 *
 * Convertir es una pestaña más (/convertir), pero se dibuja como una
 * burbuja circular que sobresale de la barra; se vuelve violeta cuando
 * es la pantalla activa.
 *
 * Microinteracción al llegar a una pestaña: el icono activo pasa de .9 a
 * 1, su etiqueta aparece con un fade y el fondo se asienta. La barra se
 * monta con cada pantalla, así que basta con animar al montar; no se
 * guarda la pestaña anterior (sería frágil con deep links o refrescos).
 */
export default function BottomNavigation() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const convertActive = isActive(pathname, CONVERT_ROUTE)

  const navRef = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const nav = navRef.current

    if (!nav) return

    return withMotion(nav, () => {
      const icon = nav.querySelector("[data-nav-icon]")
      const label = nav.querySelector("[data-nav-label]")
      const pill = nav.querySelector("[data-nav-pill]")

      if (icon) gsap.from(icon, { scale: 0.9, duration: DUR.base, ease: EASE.strong, clearProps: "transform" })
      if (label) gsap.from(label, { opacity: 0.5, duration: DUR.base, ease: EASE.out, clearProps: "opacity" })
      if (pill) {
        gsap.from(pill, { opacity: 0, scaleX: 0.6, duration: DUR.base, ease: EASE.strong, clearProps: "opacity,transform" })
      }
    })
  }, [pathname])

  return (
    <nav
      ref={navRef}
      aria-label="Navegación principal"
      // Fondo sólido, sin backdrop-blur, a propósito: con blur el WebView
      // de Android dejaba de repintar la barra mientras había un canvas de
      // gráfico en la página.
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hair bg-bg-soft"
      style={{ paddingBottom: "var(--sab)" }}
    >
      <div className="mx-auto flex h-16 w-full max-w-[520px] items-center px-1">
        {LEFT.map((item) => (
          <NavButton key={item.to} item={item} active={isActive(pathname, item.to)} onClick={() => navigate(item.to)} />
        ))}

        {/* Convertir: burbuja circular que sobresale de la barra, separada
            de ella por un anillo del color del fondo. No sigue el patrón de
            las demás pestañas a propósito: es la acción principal. */}
        <button
          type="button"
          onClick={() => navigate(CONVERT_ROUTE)}
          aria-current={convertActive ? "page" : undefined}
          aria-label="Convertir"
          className="group relative flex h-14 min-w-0 flex-1 flex-col items-center justify-end pb-[6px] outline-none"
        >
          <span
            className={`absolute -top-6 left-1/2 flex h-[52px] w-[52px] -translate-x-1/2 items-center justify-center rounded-full border shadow-[0_8px_22px_rgba(0,0,0,0.55)] ring-[5px] ring-bg-soft transition-colors duration-200 group-focus-visible:ring-brand/50 group-active:scale-95 ${
              convertActive
                ? "border-brand-light/60 bg-gradient-to-b from-brand-bright to-brand text-white"
                : "border-hairbright bg-gradient-to-b from-surface-soft to-surface text-ink"
            }`}
          >
            <ArrowLeftRight
              data-nav-icon={convertActive ? "" : undefined}
              className="h-[22px] w-[22px]"
              strokeWidth={2.2}
              aria-hidden
            />
          </span>
          <span
            data-nav-label={convertActive ? "" : undefined}
            className={`text-[11px] font-semibold leading-none ${convertActive ? "text-brand-light" : "text-ink-soft"}`}
          >
            Convertir
          </span>
        </button>

        {RIGHT.map((item) => (
          <NavButton key={item.to} item={item} active={isActive(pathname, item.to)} onClick={() => navigate(item.to)} />
        ))}
      </div>
    </nav>
  )
}
