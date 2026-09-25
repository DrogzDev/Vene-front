import type { ReactNode } from "react"

import BellAnimatedIcon from "../icons/BellAnimatedIcon"

/**
 * Acción redonda con etiqueta debajo (Convertir: Alertas y Más).
 */
export function RoundAction({
  label,
  ariaLabel,
  onClick,
  active = false,
  badge,
  children,
}: {
  label: string
  ariaLabel?: string
  onClick: () => void
  /** Estado activado (alertas encendidas): borde y color positivos. */
  active?: boolean
  badge?: number
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className="group flex min-w-[72px] flex-col items-center gap-1.5 rounded-tile py-1 outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
    >
      <span
        className={`relative flex h-[52px] w-[52px] items-center justify-center rounded-full border transition duration-200 group-hover:-translate-y-px group-active:scale-95 ${
          active
            ? "border-up/25 bg-up/10 text-up"
            : "border-hair bg-surface text-ink-soft group-hover:border-hairbright group-hover:text-ink"
        }`}
      >
        {children}

        {badge != null && badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-bg bg-down px-1 text-[10px] font-bold leading-none text-bg">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className="text-[12px] font-medium text-ink-muted transition-colors duration-200 group-hover:text-ink-soft">
        {label}
      </span>
    </button>
  )
}

/** Campana de alertas bancarias, animada. Verde si están activadas. */
export default function AlertsBell({
  unreadCount = 0,
  alertsEnabled = false,
  onClick,
}: {
  unreadCount?: number
  alertsEnabled?: boolean
  onClick: () => void
}) {
  return (
    <RoundAction
      label="Alertas"
      ariaLabel={unreadCount > 0 ? `Alertas bancarias, ${unreadCount} sin leer` : "Alertas bancarias"}
      onClick={onClick}
      active={alertsEnabled}
      badge={unreadCount}
    >
      <BellAnimatedIcon className="h-[22px] w-[22px]" onceKey="convert-bell" delay={0.35} />
    </RoundAction>
  )
}
