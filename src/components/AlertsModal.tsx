import { useState } from "react"
import type { DollarAlert } from "../services/alerts"

type AlertsModalProps = {
  isOpen: boolean
  onClose: () => void
  alerts: DollarAlert[]
  alertsEnabled: boolean
  onEnableAlerts: () => void
  onDisableAlerts: () => void
  alertsError?: string
}

function formatAlertTime(alert: DollarAlert) {
  return (
    alert.telegram_sent_at_ve_pretty ||
    alert.telegram_sent_at_ve ||
    alert.telegram_sent_at_utc ||
    ""
  )
}

function getFirstLine(text: string) {
  const firstLine = text.split("\n").find((line) => line.trim())
  return firstLine || "BANCAMIGA"
}

function cleanAlertText(text: string) {
  return text.trim()
}

export default function AlertsModal({
  isOpen,
  onClose,
  alerts,
  alertsEnabled,
  onEnableAlerts,
  onDisableAlerts,
  alertsError,
}: AlertsModalProps) {
  const [allMessagesOpen, setAllMessagesOpen] = useState(false)

  if (!isOpen) return null

  const latestAlert = alerts[0] || null

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-xl"
        style={{ height: "100dvh" }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative flex max-h-[82dvh] w-full max-w-xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#11141a]/95 text-[#e7e9ee] shadow-[0_24px_90px_rgba(0,0,0,0.55)]"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-red-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-20 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative flex items-center justify-between gap-4 border-b border-white/10 px-5 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-300">
                Último mensaje
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                Alerta Bancamiga
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#b8beca] transition hover:bg-white/10 hover:text-white"
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
            <div className="mx-5 mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {alertsError}
            </div>
          )}

          <div className="relative flex-1 overflow-y-auto px-5 py-5">
            {!latestAlert ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center">
                <p className="text-sm font-semibold text-white">
                  Todavía no hay alertas
                </p>
                <p className="mt-1 text-sm leading-6 text-[#8b92a0]">
                  Cuando el backend detecte BANCAMIGA, aparecerá aquí.
                </p>
              </div>
            ) : (
              <div className="rounded-[28px] border border-red-400/20 bg-red-500/[0.08] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-200">
                    Telegram
                  </span>

                  <span className="rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-medium text-red-100">
                    ID {latestAlert.telegram_message_id}
                  </span>
                </div>

                <p className="whitespace-pre-line text-[15px] leading-7 text-[#f4f6fb]">
                  {cleanAlertText(latestAlert.message_text)}
                </p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b92a0]">
                    Avisado
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {formatAlertTime(latestAlert)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="relative border-t border-white/10 bg-[#11141a]/90 px-5 py-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setAllMessagesOpen(true)}
                disabled={alerts.length === 0}
                className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-1"
              >
                Ver todos ({alerts.length})
              </button>

              <button
                type="button"
                onClick={alertsEnabled ? onDisableAlerts : onEnableAlerts}
                className={`rounded-full border px-4 py-3 text-sm font-semibold transition sm:col-span-1 ${
                  alertsEnabled
                    ? "border-red-400/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                    : "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                }`}
              >
                {alertsEnabled ? "Desactivar alertas" : "Activar alertas"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#11141a] transition hover:bg-[#dfe3ea] sm:col-span-1"
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
            className="relative flex max-h-[86dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#11141a]/95 text-[#e7e9ee] shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-red-500/20 blur-3xl" />

            <div className="relative flex items-center justify-between gap-4 border-b border-white/10 px-5 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-300">
                  Historial
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                  Todos los mensajes
                </h2>
                <p className="mt-1 text-sm text-[#8b92a0]">
                  {alerts.length} mensajes guardados de Bancamiga.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAllMessagesOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#b8beca] transition hover:bg-white/10 hover:text-white"
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
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center">
                  <p className="text-sm font-semibold text-white">
                    No hay mensajes guardados
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <article
                      key={alert.id}
                      className={`rounded-[26px] border p-4 transition ${
                        index === 0
                          ? "border-red-400/20 bg-red-500/[0.08]"
                          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {index === 0
                              ? "Más reciente"
                              : getFirstLine(alert.message_text)}
                          </p>

                          <p className="mt-0.5 text-[11px] text-[#8b92a0]">
                            {formatAlertTime(alert)}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-medium text-[#b8beca]">
                          ID {alert.telegram_message_id}
                        </span>
                      </div>

                      <p className="whitespace-pre-line text-sm leading-6 text-[#d7dbe3]">
                        {cleanAlertText(alert.message_text)}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="relative border-t border-white/10 bg-[#11141a]/90 px-5 py-4">
              <button
                type="button"
                onClick={() => setAllMessagesOpen(false)}
                className="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#11141a] transition hover:bg-[#dfe3ea]"
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