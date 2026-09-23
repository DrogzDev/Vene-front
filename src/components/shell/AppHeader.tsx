import { isValidElement } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, ChevronLeft } from "lucide-react"
import type { LucideIcon } from "lucide-react"

// El logo de VeneCambio. Es el mismo asset de siempre; no se recrea.
import icon from "../../assets/icon.svg"

type HomeProps = {
  variant: "home"
  /** Número de alertas sin leer; 0 oculta el badge. */
  unreadCount?: number
  alertsEnabled?: boolean
  onBellClick?: () => void
  onLogoClick?: () => void
}

type DetailProps = {
  variant: "detail"
  title: string
  subtitle?: string
  /** Ruta a la que vuelve la flecha. Por defecto, el historial del navegador. */
  backTo?: string
  actions?: ReactNode
}

/** Pantalla raíz de una pestaña: sin flecha de volver, como una app nativa. */
type TabProps = {
  variant: "tab"
  /** Icono de Lucide o, para las pestañas con identidad propia, un VcIcon. */
  icon: LucideIcon | ReactNode
  /** Color del icono (hex). Por defecto, el violeta de marca. */
  accent?: string
  title: string
  subtitle?: string
  actions?: ReactNode
}

type Props = HomeProps | DetailProps | TabProps

/**
 * Cabecera compacta (56 px) y pegajosa.
 *
 * Se queda arriba al hacer scroll, justo bajo la barra de estado
 * (top: --sat), con el mismo fondo de la app para que el contenido que
 * pasa por debajo no se lea a través.
 */
function StickyBar({ children, enter = false }: { children: ReactNode; enter?: boolean }) {
  return (
    <header
      // Solo Inicio anima la cabecera dentro de su cascada de entrada; en
      // el resto de pantallas entra con la página entera.
      data-enter={enter ? "" : undefined}
      className="sticky z-20 -mx-4 flex h-14 items-center gap-3 bg-bg px-4 sm:-mx-5 sm:px-5"
      style={{ top: "var(--sat)" }}
    >
      {children}
    </header>
  )
}

/** Un LucideIcon es un componente; un VcIcon llega ya como elemento. */
function renderTabIcon(icon: LucideIcon | ReactNode) {
  if (isValidElement(icon)) return icon

  const Icon = icon as LucideIcon

  return <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
}

export default function AppHeader(props: Props) {
  const navigate = useNavigate()

  if (props.variant === "home") {
    const { unreadCount = 0, alertsEnabled, onBellClick, onLogoClick } = props

    return (
      <StickyBar enter>
        <button
          type="button"
          onClick={onLogoClick}
          aria-label="Apoyar VeneCambio"
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-tile text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <img src={icon} alt="" aria-hidden className="h-9 w-9 shrink-0 rounded-[10px]" />
          <span className="min-w-0">
            <span className="block truncate text-[17px] font-extrabold leading-tight tracking-tight text-ink">
              Venecambio
            </span>
            <span className="block truncate text-[11px] font-medium text-ink-faint">
              Tasa libre de Venezuela
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onBellClick}
          aria-label={unreadCount > 0 ? `Alertas, ${unreadCount} sin leer` : "Alertas"}
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-95 ${
            alertsEnabled ? "bg-up/10 text-up" : "bg-surface text-ink-soft hover:bg-surface-raised"
          }`}
        >
          <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />

          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-bg bg-down px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </StickyBar>
    )
  }

  if (props.variant === "tab") {
    const { icon, accent = "#9D72FF", title, subtitle, actions } = props

    return (
      <StickyBar>
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accent}1f`, color: accent }}
        >
          {renderTabIcon(icon)}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[20px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="truncate text-[12px] text-ink-muted">{subtitle}</p>}
        </div>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </StickyBar>
    )
  }

  const { title, subtitle, backTo, actions } = props

  return (
    <StickyBar>
      <button
        type="button"
        onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        aria-label="Volver"
        className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft outline-none transition duration-150 hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-95"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2.2} aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[19px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="truncate text-[12px] text-ink-muted">{subtitle}</p>}
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </StickyBar>
  )
}
