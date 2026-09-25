import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft } from "lucide-react"

type DetailProps = {
  variant: "detail"
  title: string
  subtitle?: string
  /** Ruta a la que vuelve la flecha. Por defecto, el historial del navegador. */
  backTo?: string
  actions?: ReactNode
}

/**
 * Pantalla raíz de una pestaña: sin flecha de volver, como una app
 * nativa, y sin textos de sección (la barra inferior ya dice dónde se
 * está). `title` solo lo leen los lectores de pantalla.
 */
type TabProps = {
  variant: "tab"
  title: string
  actions?: ReactNode
}

type Props = DetailProps | TabProps

/**
 * Cabecera compacta (56 px) y pegajosa de las pantallas de detalle.
 *
 * Se queda arriba al hacer scroll, justo bajo la barra de estado
 * (top: --sat), con el mismo fondo de la app para que el contenido que
 * pasa por debajo no se lea a través.
 */
function StickyBar({ children }: { children: ReactNode }) {
  return (
    <header
      className="sticky z-20 -mx-4 flex h-14 items-center gap-3 bg-bg px-4 sm:-mx-5 sm:px-5"
      style={{ top: "var(--sat)" }}
    >
      {children}
    </header>
  )
}

export default function AppHeader(props: Props) {
  const navigate = useNavigate()

  if (props.variant === "tab") {
    // Sin textos de sección: la barra inferior ya indica dónde se está.
    // El título se conserva solo para lectores de pantalla (cada pantalla
    // necesita su encabezado), y los controles propios (Analizar,
    // Simple/Pro) siguen arriba a la derecha.
    const { title, actions } = props

    if (!actions) {
      return (
        <div className="h-3">
          <h1 className="sr-only">{title}</h1>
        </div>
      )
    }

    // Sin barra ni fondo: los controles quedan arriba a la derecha y se
    // desplazan con la página. Una barra pegajosa pintaba una franja
    // negra de borde a borde sobre la luz de fondo al hacer scroll.
    return (
      <div className="flex h-12 items-center justify-end">
        <h1 className="sr-only">{title}</h1>
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </div>
    )
  }

  const { title, subtitle, backTo, actions } = props

  return (
    <StickyBar>
      <button
        type="button"
        onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        aria-label="Volver"
        className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft outline-none transition duration-150 hover:bg-surface focus-visible:ring-2 focus-visible:ring-gold/40 active:scale-95"
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
