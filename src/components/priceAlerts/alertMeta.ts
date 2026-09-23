import type { LucideIcon } from "lucide-react"
import { ChartColumnIncreasing, CircleDollarSign, Landmark } from "lucide-react"

import {
  formatAmount,
  type PriceAlert,
  type PriceAlertOperator,
  type PriceAlertSource,
  type PriceAlertStatus,
} from "../../services/priceAlerts"

export const SOURCE_META: Record<
  PriceAlertSource,
  { label: string; icon: LucideIcon; accent: string }
> = {
  USDT: { label: "USDT", icon: CircleDollarSign, accent: "#20D6A0" },
  BCV: { label: "BCV", icon: Landmark, accent: "#3AA8FF" },
  AVERAGE: { label: "Promedio", icon: ChartColumnIncreasing, accent: "#9D72FF" },
}

export const SOURCE_ORDER: PriceAlertSource[] = ["USDT", "BCV", "AVERAGE"]

export const OPERATOR_SYMBOL: Record<PriceAlertOperator, string> = {
  GTE: "≥",
  LTE: "≤",
}

export const STATUS_META: Record<PriceAlertStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Activa", className: "border-up/30 bg-up/10 text-up" },
  PAUSED: { label: "Pausada", className: "border-hair bg-surface-raised text-ink-muted" },
  TRIGGERED: { label: "Cumplida", className: "border-brand/30 bg-brand/10 text-brand-light" },
}

export function alertTitle(alert: Pick<PriceAlert, "source" | "operator" | "target_price">) {
  return `${SOURCE_META[alert.source].label} ${OPERATOR_SYMBOL[alert.operator]} Bs ${formatAmount(alert.target_price)}`
}

export function alertSubtitle(alert: PriceAlert) {
  if (alert.status === "TRIGGERED") return "Se cumplió el objetivo."
  if (alert.status === "PAUSED") return "Pausada: no te avisará."
  if (alert.frequency === "REPEAT") return "Te avisaremos cada vez que cruce el objetivo."

  return "Te avisaremos al llegar al objetivo."
}
