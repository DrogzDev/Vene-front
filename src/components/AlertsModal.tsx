import { useState } from "react"
import type { DollarAlert } from "../services/alerts"

type AlertsModalProps = {
  isOpen: boolean
  onClose: () => void
  alerts: DollarAlert[]
  alertsEnabled: boolean
  onEnableAlerts: () => void | Promise<void>
  onDisableAlerts: () => void | Promise<void>
  onEnableSound?: () => void | Promise<void>
  alertsError?: string
}

function formatAlertTime(alert: DollarAlert) {
  return alert.detected_at_ve_pretty || ""
}

function getFirstLine(text: string) {
  const firstLine = text.split("\n").find((line) => line.trim())
  return firstLine || "Alerta bancaria"
}

function cleanAlertText(text: string) {
  return text.trim()
}

function getAlertBankLabel(alertType: string) {
  if (alertType === "bancamiga_intervention") return "Bancamiga"
  if (alertType === "bdv_intervention") return "BDV"
  return "Alerta"
}

export default function AlertsModal({
  isOpen,
  onClose,
  alerts,
  alertsEnabled,
  onEnableAlerts,
  onDisableAlerts,
  onEnableSound,
  alertsError,
}: AlertsModalProps) {
  const [allMessagesOpen, setAllMessagesOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  if (!isOpen) return null

  const latestAlert = alerts[0] || null

  async function handleAlertsButtonClick() {
    if (actionLoading) return

    try {
      setActionLoading(true)

      if (alertsEnabled) {
        await onDisableAlerts()
        return
      }

      const soundPromise = onEnableSound ? onEnableSound() : Promise.resolve()

      await onEnableAlerts()

      await soundPromise
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-xl"
        style={{ height: "100dvh" }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative flex max-h-[82dvh] w-full max-w-xl flex-col overflow-hidden rounded-card border border-hair bg-surface/95 text-ink shadow-[0_24px_90px_rgba(0,0,0,0.55)]"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-red-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-20 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative flex items-center justify-between gap-4 border-b border-hair px-5 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-down">
                Último mensaje
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                Alerta bancaria
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hair bg-surface-raised text-ink-soft transition hover:bg-surface-soft hover:text-white"
              aria-label="Cerrar modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          {alertsError && (
            <div className="mx-5 mt-4 rounded-tile border border-down/25 bg-down/10 px-4 py-3 text-sm text-down">
              {alertsError}
            </div>
          )}

          <div className="relative flex-1 overflow-y-auto px-5 py-5">
            {!latestAlert ? (
              <div className="rounded-card border border-hair bg-surface-raised p-5 text-center">
                <p className="text-sm font-semibold text-white">
                  Todavía no hay alertas
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  Cuando se detecte una intervención bancaria, aparecerá aquí.
                </p>
              </div>
            ) : (
              <div className="rounded-card border border-down/25 bg-down/[0.08] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-down/25 bg-down/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-down">
                    {getAlertBankLabel(latestAlert.alert_type)}
                  </span>

                  <span className="rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                    ID {latestAlert.telegram_message_id}
                  </span>
                </div>

                <p className="whitespace-pre-line text-[15px] leading-7 text-ink">
                  {cleanAlertText(latestAlert.message_text)}
                </p>

                <div className="mt-5 rounded-tile border border-hair bg-black/20 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                    Avisado
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {formatAlertTime(latestAlert)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="relative border-t border-hair bg-surface/90 px-5 py-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setAllMessagesOpen(true)}
                disabled={alerts.length === 0}
                className="min-h-11 rounded-full border border-hair bg-surface-raised px-4 text-sm font-semibold text-ink transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-1"
              >
                Ver todos ({alerts.length})
              </button>

              <button
                type="button"
                onClick={handleAlertsButtonClick}
                disabled={actionLoading}
                className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 sm:col-span-1 ${
                  alertsEnabled
                    ? "border-down/30 bg-down/10 text-down hover:bg-down/15"
                    : "border-transparent bg-brand text-white hover:bg-brand-bright"
                }`}
              >
                {actionLoading
                  ? alertsEnabled
                    ? "Desactivando..."
                    : "Activando..."
                  : alertsEnabled
                    ? "Desactivar alertas"
                    : "Activar alertas"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-full border border-hair bg-surface-raised px-4 text-sm font-semibold text-ink-soft transition hover:text-ink sm:col-span-1"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {allMessagesOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-xl"
          style={{ height: "100dvh" }}
          onClick={() => setAllMessagesOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[86dvh] w-full max-w-2xl flex-col overflow-hidden rounded-card border border-hair bg-surface/95 text-ink shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
          >
            
            <div className="relative flex items-center justify-between gap-4 border-b border-hair px-5 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-down">
                  Historial
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                  Todos los mensajes
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {alerts.length} mensajes guardados.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAllMessagesOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hair bg-surface-raised text-ink-soft transition hover:bg-surface-soft hover:text-white"
                aria-label="Cerrar historial"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="relative flex-1 overflow-y-auto px-5 py-5">
              {alerts.length === 0 ? (
                <div className="rounded-card border border-hair bg-surface-raised p-5 text-center">
                  <p className="text-sm font-semibold text-white">
                    No hay mensajes guardados
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <article
                      key={alert.id}
                      className={`rounded-tile border p-4 transition ${
                        index === 0
                          ? "border-down/25 bg-down/[0.08]"
                          : "border-hair bg-surface-raised"
                      }`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {index === 0
                              ? "Más reciente"
                              : getFirstLine(alert.message_text)}
                          </p>

                          <p className="mt-0.5 text-[11px] text-ink-muted">
                            {formatAlertTime(alert)}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-hair bg-bg px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                          ID {alert.telegram_message_id}
                        </span>
                      </div>

                      <p className="whitespace-pre-line text-sm leading-6 text-ink-soft">
                        {cleanAlertText(alert.message_text)}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="relative border-t border-hair bg-surface/90 px-5 py-4">
              <button
                type="button"
                onClick={() => setAllMessagesOpen(false)}
                className="min-h-11 w-full rounded-full bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-bright"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}