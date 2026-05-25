import icon from "../assets/icon.svg"
import AlertsModal from "../components/AlertsModal"
import type { DollarAlert } from "../services/alerts"

type HeaderProps = {
  onLogoClick?: () => void

  alertsOpen: boolean
  onAlertsClick: () => void
  onCloseAlerts: () => void

  alerts: DollarAlert[]
  alertsEnabled: boolean
  onEnableAlerts: () => void | Promise<void>
  onDisableAlerts: () => void | Promise<void>
  onEnableSound?: () => void | Promise<void>
  alertsError: string
  unreadCount: number
}

export default function Header({
  onLogoClick,
  alertsOpen,
  onAlertsClick,
  onCloseAlerts,
  alerts,
  alertsEnabled,
  onEnableAlerts,
  onDisableAlerts,
  onEnableSound,
  alertsError,
  unreadCount,
}: HeaderProps) {
  return (
    <>
      <header className="animate-fade-up flex w-full items-center justify-between gap-4">
        <button
          type="button"
          onClick={onLogoClick}
          className="flex min-w-0 items-center gap-3 rounded-2xl text-left transition hover:opacity-90"
          aria-label="Abrir donaciones"
        >
          <img
            src={icon}
            alt="Vex Icon"
            className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
          />

          <div className="min-w-0">
            <h1 className="truncate text-[clamp(1.5rem,4dvw,2rem)] font-bold leading-none tracking-tight text-[#e7e9ee]">
              Venecambio
            </h1>

            <p className="mt-1 truncate text-[clamp(0.6rem,2dvw,0.72rem)] uppercase tracking-[0.18em] text-[#7f8694]">
              Tasa libre de Venezuela
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onAlertsClick}
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-[0_12px_35px_rgba(0,0,0,0.35)] backdrop-blur transition hover:-translate-y-0.5 active:scale-95 ${
            alertsEnabled
              ? "border-lime-400/40 bg-lime-400/10 text-lime-300 hover:border-lime-300/60 hover:bg-lime-400/15"
              : "border-[#2a2f38] bg-[#171a21]/90 text-[#d7dbe3] hover:border-white/20 hover:bg-[#20252e] hover:text-white"
          }`}
          aria-label={
            alertsEnabled
              ? "Alertas bancarias activas"
              : "Abrir alertas bancarias"
          }
          title={alertsEnabled ? "Alertas activas" : "Alertas bancarias"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 9.5a6 6 0 0 0-12 0c0 4.7-1.5 6.4-2.3 7.1A1 1 0 0 0 4.4 18h15.2a1 1 0 0 0 .7-1.7C19.5 15.6 18 14.2 18 9.5Z" />
            <path d="M10 21h4" />
          </svg>

          {alertsEnabled && (
            <span
              className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-[#151922] bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.85)]"
              aria-hidden="true"
            />
          )}

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#151922] bg-[#ef4444] px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_0_12px_rgba(239,68,68,0.65)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </header>

      <AlertsModal
        isOpen={alertsOpen}
        onClose={onCloseAlerts}
        alerts={alerts}
        alertsEnabled={alertsEnabled}
        onEnableAlerts={onEnableAlerts}
        onDisableAlerts={onDisableAlerts}
        onEnableSound={onEnableSound}
        alertsError={alertsError}
      />
    </>
  )
}