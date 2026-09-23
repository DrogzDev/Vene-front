import { useEffect, useState } from "react"
import { Plus } from "lucide-react"

import AppShell from "../components/shell/AppShell"
import AppHeader from "../components/shell/AppHeader"
import PriceAlertRow from "../components/priceAlerts/PriceAlertRow"
import PriceAlertSheet from "../components/priceAlerts/PriceAlertSheet"
import { usePriceAlerts } from "../components/priceAlerts/usePriceAlerts"
import { OPERATOR_SYMBOL, SOURCE_META } from "../components/priceAlerts/alertMeta"
import { Section } from "../components/settings/SettingsList"
import { PRICE_ALERT_RECEIVED_EVENT } from "../services/notifications"
import {
  formatAmount,
  getPriceAlertHistory,
  type PriceAlert,
  type PriceAlertTrigger,
} from "../services/priceAlerts"
import { formatDate } from "../utils/format"

const DELIVERY_LABELS: Record<PriceAlertTrigger["notification_status"], string> = {
  PENDING: "Enviando aviso…",
  SENT: "Aviso enviado",
  FAILED: "No se pudo enviar el aviso",
  NO_RECIPIENTS: "Sin dispositivos con push activo",
  SKIPPED: "Push desactivado en la alerta",
  EXPIRED: "Aviso vencido sin enviar",
}

/** Todas las alertas de precio y el historial de disparos. */
export default function PriceAlertsPage() {
  const { alerts, currentPrices, loading, error, reload } = usePriceAlerts()
  const [history, setHistory] = useState<PriceAlertTrigger[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null)

  useEffect(() => {
    function loadHistory() {
      getPriceAlertHistory()
        .then((data) => setHistory(data.results))
        .catch(() => setHistory([]))
    }

    loadHistory()
    window.addEventListener(PRICE_ALERT_RECEIVED_EVENT, loadHistory)
    return () => window.removeEventListener(PRICE_ALERT_RECEIVED_EVENT, loadHistory)
  }, [])

  function openSheet(alert: PriceAlert | null) {
    setEditingAlert(alert)
    setSheetOpen(true)
  }

  return (
    <>
      <AppShell>
        <AppHeader
          variant="detail"
          title="Alertas de precio"
          subtitle={`${alerts.filter((alert) => alert.is_active).length} activas`}
          backTo="/mas"
        />

        <Section title="Tus alertas">
          <button
            type="button"
            onClick={() => openSheet(null)}
            className="flex min-h-11 w-full items-center gap-3 border-b border-hair bg-brand/15 px-4 py-3 text-left outline-none transition last:border-b-0 hover:bg-brand/20 focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <Plus className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden />
            </span>
            <span className="text-[14px] font-semibold text-ink">Crear alerta</span>
          </button>

          {alerts.map((alert) => (
            <PriceAlertRow key={alert.id} alert={alert} onOpen={openSheet} />
          ))}

          {loading && alerts.length === 0 && (
            <p className="px-4 py-3 text-[12px] text-ink-faint">Cargando alertas…</p>
          )}
          {error && <p className="px-4 py-3 text-[12px] text-down">{error}</p>}
        </Section>

        <Section title="Historial">
          {history.length === 0 ? (
            <p className="px-4 py-3.5 text-[12px] text-ink-muted">Todavía no se ha cumplido ninguna alerta.</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="border-b border-hair px-4 py-3 last:border-b-0">
                <p className="text-[14px] font-semibold tabular-nums text-ink">
                  {SOURCE_META[item.source].label} {item.operator === "GTE" ? "alcanzó" : "bajó a"} Bs{" "}
                  {formatAmount(item.price)}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-muted">
                  Objetivo {OPERATOR_SYMBOL[item.operator]} Bs {formatAmount(item.target_price)} ·{" "}
                  {formatDate(item.triggered_at)}
                </p>
                <p className={`mt-0.5 text-[11px] ${item.notification_sent ? "text-up" : "text-ink-faint"}`}>
                  {DELIVERY_LABELS[item.notification_status]}
                </p>
              </div>
            ))
          )}
        </Section>
      </AppShell>

      <PriceAlertSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        alert={editingAlert}
        currentPrices={currentPrices}
        onSaved={reload}
      />
    </>
  )
}
