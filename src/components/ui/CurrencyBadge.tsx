import { Wallet } from "lucide-react"

import { CurrencyIcon } from "./VcIcon"
import type { CurrencyIconName } from "./VcIcon"

export type CurrencyCode = "VES" | "USD" | "EUR" | "USDT" | "DIV"

const META: Record<CurrencyCode, { icon: CurrencyIconName | null; label: string }> = {
  VES: { icon: "ves", label: "Bolívares" },
  USD: { icon: "usd", label: "Dólares" },
  EUR: { icon: "eur", label: "Euros" },
  USDT: { icon: "usdt", label: "USDT" },
  // Tasa personalizada: no es un activo concreto, así que no lleva
  // bandera ni logo; un icono genérico de cartera.
  DIV: { icon: null, label: "Divisa" },
}

/** Código de moneda con su icono. Sin emojis ni banderas Unicode. */
export default function CurrencyBadge({ code }: { code: CurrencyCode }) {
  const meta = META[code]

  return (
    <span
      title={meta.label}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-hair bg-surface-raised pl-1 pr-3"
    >
      {meta.icon ? (
        <CurrencyIcon name={meta.icon} className="h-7 w-7" />
      ) : (
        <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-brand-light">
          <Wallet className="h-4 w-4" strokeWidth={2.2} />
        </span>
      )}
      <span className="text-[13px] font-bold text-ink">{code}</span>
    </span>
  )
}
