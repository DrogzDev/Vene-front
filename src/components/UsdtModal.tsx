import { useEffect } from "react"

import { formatBs } from "../utils/format"

type UsdtOffer = {
  nickName: string
  price: number
  userIdentity: string
  payTypes: string[]
}

type UsdtModalProps = {
  isOpen: boolean
  onClose: () => void
  offers: UsdtOffer[]
  bestPrice: number
}

export default function UsdtModal({
  isOpen,
  onClose,
  offers,
  bestPrice,
}: UsdtModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEsc)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = "auto"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ height: '100dvh' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div
        className="relative w-full max-w-lg rounded-t-3xl border border-hair bg-surface p-5 text-ink shadow-[0_-16px_50px_rgba(0,0,0,0.5)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(1.25rem + var(--sab))" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[clamp(1rem,3dvw,1.125rem)] font-semibold text-ink">
            Ofertas USDT P2P
          </h3>

          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-raised transition hover:bg-surface-soft"
          >
            <svg
              className="h-5 w-5 text-ink-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-sm text-ink-muted">
          Mejor precio:{" "}
          <span className="font-semibold text-ink">
            Bs {formatBs(bestPrice)}
          </span>
        </p>

        <div className="max-h-[clamp(20rem,50dvh,24rem)] space-y-3 overflow-y-auto pr-1">
          {offers.map((offer, index) => (
            <div
              key={`${offer.nickName}-${index}`}
              className="rounded-tile border border-hair bg-surface-raised px-4 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {offer.nickName}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {offer.userIdentity || "Verificado"}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {offer.payTypes.join(", ")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-ink">
                    Bs {formatBs(offer.price)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-5 min-h-11 w-full rounded-full border border-hair bg-surface-raised text-sm font-semibold text-ink-soft transition hover:text-ink"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}