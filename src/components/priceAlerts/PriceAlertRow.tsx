import { Bell, BellOff, ChevronRight } from "lucide-react"

import type { PriceAlert } from "../../services/priceAlerts"
import { SOURCE_META, STATUS_META, alertSubtitle, alertTitle } from "./alertMeta"

export default function PriceAlertRow({
  alert,
  onOpen,
}: {
  alert: PriceAlert
  onOpen: (alert: PriceAlert) => void
}) {
  const meta = SOURCE_META[alert.source]
  const status = STATUS_META[alert.status]
  const Icon = meta.icon
  const BellIcon = alert.push_enabled && alert.is_active ? Bell : BellOff

  return (
    <button
      type="button"
      onClick={() => onOpen(alert)}
      className="flex min-h-11 w-full items-center gap-3 border-b border-hair px-4 py-3 text-left outline-none transition duration-200 last:border-b-0 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.99]"
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${meta.accent}1f`, color: meta.accent }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold tabular-nums text-ink">
          {alertTitle(alert)}
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-ink-muted">
          {alertSubtitle(alert)}
        </span>
      </span>

      <BellIcon
        aria-hidden
        className={`h-4 w-4 shrink-0 ${alert.is_active ? "text-brand-light" : "text-ink-faint"}`}
        strokeWidth={2.1}
      />

      <span
        className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
      >
        {status.label}
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2.2} aria-hidden />
    </button>
  )
}
