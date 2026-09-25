import { useLayoutEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import type { ComponentType } from "react"

import ConvertAnimatedIcon from "../icons/ConvertAnimatedIcon"
import HistoryAnimatedIcon from "../icons/HistoryAnimatedIcon"
import MarketAnimatedIcon from "../icons/MarketAnimatedIcon"
import SlingButton from "../ui/SlingButton"

import { DUR, EASE, gsap, withMotion } from "../../motion/motion"

/** Un icono de Lucide o uno propio con la misma forma (className + trazo). */
type NavIcon = ComponentType<{ className?: string; strokeWidth?: number }>

/**
 * Mercado: el icono animado. La entrada se dibuja una vez por sesión; la
 * animación continua corre siempre, en todas las pantallas.
 */
function MarketNavIcon(props: { className?: string; strokeWidth?: number }) {
  return <MarketAnimatedIcon {...props} onceKey="bottom-nav" delay={0.35} />
}

/** Historial: el reloj animado; la entrada se ve una vez por sesión. */
function HistoryNavIcon(props: { className?: string; strokeWidth?: number }) {
  return <HistoryAnimatedIcon {...props} onceKey="bottom-nav-history" delay={0.45} />
}

type Item = {
  to: string
  label: string
  icon: NavIcon
}

// Tres destinos, simétricos: Mercado · Convertir (inicio) · Historial.
// Más se abre desde el botón de Convertir.
const LEFT: Item[] = [{ to: "/usdt-analisis", label: "Mercado", icon: MarketNavIcon }]

const RIGHT: Item[] = [{ to: "/historial", label: "Historial", icon: HistoryNavIcon }]

// Convertir es la pantalla de inicio.
const CONVERT_ROUTE = "/"

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
      className="relative flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-ctl outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-gold/40 active:scale-95"
    >
      <Icon
        data-nav-icon={active ? "" : undefined}
        className={`h-[22px] w-[22px] transition-colors duration-200 ${active ? "text-gold" : "text-ink-faint"}`}
        strokeWidth={active ? 2.2 : 1.9}
        aria-hidden
      />
      <span
        data-nav-label={active ? "" : undefined}
        className={`max-w-full truncate px-0.5 text-[11px] leading-none transition-colors duration-200 ${
          active ? "font-semibold text-gold" : "font-medium text-ink-faint"
        }`}
      >
        {item.label}
      </span>
      {/* Indicador del activo: una línea dorada corta, no un bloque. */}
      {active && (
        <span data-nav-pill aria-hidden className="absolute bottom-1.5 h-0.5 w-[18px] rounded-full bg-gold" />
      )}
    </button>
  )
}

/**
 * Navegación inferior fija: 64 px + safe area.
 *
 * Convertir es una pestaña más (/convertir), pero se dibuja como la
 * acción principal: un círculo dorado que sobresale de la barra. Es el
 * ÚNICO botón dorado de la app; el resto de la navegación es gris y el
 * activo se marca con un dorado contenido.
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hair bg-nav"
      style={{ paddingBottom: "var(--sab)" }}
    >
      <div aria-hidden className="nav-sheen" />

      <div className="relative mx-auto flex h-16 w-full max-w-[420px] items-center px-1">
        {LEFT.map((item) => (
          <NavButton key={item.to} item={item} active={isActive(pathname, item.to)} onClick={() => navigate(item.to)} />
        ))}

        {/* Convertir: burbuja circular que sobresale de la barra, separada
            de ella por un anillo del color del fondo. No sigue el patrón de
            las demás pestañas a propósito: es la acción principal. Arrastrar
            y soltar la dispara con la animación de resortera (SlingButton,
            ver ui/SlingButton.tsx); un simple toque sigue navegando al
            instante igual que antes. */}
        <div className="relative flex h-16 min-w-0 flex-1 flex-col items-center justify-end pb-[10px]">
          {/* SlingButton fija su propio position:relative — las clases de
              posicionamiento van en este div envolvente, no en su
              `className`, o pierden el pulso de especificidad CSS contra
              la hoja de estilos propia del componente. */}
          <div className="absolute -top-[22px] left-1/2 -translate-x-1/2">
            <SlingButton
              onSend={() => navigate(CONVERT_ROUTE)}
              ariaLabel="Convertir"
              ariaCurrent={convertActive ? "page" : undefined}
              size={58}
              padColor="rgb(var(--c-gold))"
              iconColor="rgb(var(--c-on-gold))"
              accentColor="rgb(var(--c-gold))"
              wellColor="rgb(var(--c-nav))"
              bandColor="rgb(var(--c-border-default))"
              maxPull={60}
              armAt={22}
              flight={45}
              particles={10}
              padClassName="shadow-cta ring-[5px] ring-[rgb(var(--c-nav))]"
            >
              {/* Si se tocó Convertir justo antes (aquí o en Inicio), la
                  pantalla nueva recibe el giro de las flechas al montarse. */}
              <ConvertAnimatedIcon
                data-nav-icon={convertActive ? "" : undefined}
                className="h-6 w-6"
                strokeWidth={2.2}
                onceKey="bottom-nav-convert"
                delay={0.5}
                spinOnArrive
              />
            </SlingButton>
          </div>
          <span
            data-nav-label={convertActive ? "" : undefined}
            className="text-[11px] font-semibold leading-none text-ink"
          >
            Convertir
          </span>
        </div>

        {RIGHT.map((item) => (
          <NavButton key={item.to} item={item} active={isActive(pathname, item.to)} onClick={() => navigate(item.to)} />
        ))}
      </div>
    </nav>
  )
}
