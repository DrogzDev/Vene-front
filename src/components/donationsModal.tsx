type DonationsModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function DonationsModal({
  isOpen,
  onClose,
}: DonationsModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-md px-3 pb-4 pt-10 sm:items-center sm:p-6"
      style={{ height: '100dvh' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-card border border-hair bg-surface p-5 text-ink shadow-card sm:p-6 animate-[fadeIn_.18s_ease-out]"
      >
        <div className="mb-4 flex justify-center sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-hairbright" />
        </div>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-bold tracking-tight text-ink">
              Donaciones
            </h2>
            <p className="mt-1 text-[13px] leading-6 text-ink-muted">
              Si te gusta la app, puedes apoyarla aquí de forma rápida y sencilla.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hair bg-surface-raised text-ink-soft transition hover:bg-surface-raised hover:text-ink"
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

        <div className="space-y-4">
          <div className="rounded-tile border border-hair bg-surface-raised p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-full bg-brand/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-light">
                PayPal
              </div>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                Disponible
              </span>
            </div>

            <a
              href="https://www.paypal.com/paypalme/Joncitodonameporfavo?locale.x=es_XC&country.x=VE"
              target="_blank"
              rel="noopener noreferrer"
              className="block break-all text-[13px] font-semibold text-ink transition hover:text-brand-light hover:underline"
            >
              paypal.me/Joncitodonameporfavo
            </a>

            <p className="mt-2 text-[12px] leading-5 text-ink-muted">
              Haz clic en el enlace para donar directamente por PayPal.
            </p>
          </div>

          <div className="rounded-tile border border-hair bg-surface-raised p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-full bg-brand/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-light">
                Binance Pay
              </div>

              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-600">
                USDT
              </span>
            </div>

            <p className="text-[13px] text-ink-muted">ID de pago</p>
            <p className="mt-1 text-[18px] font-bold tabular-nums tracking-wide text-ink">
              74982558
            </p>

            <p className="mt-2 text-[12px] leading-5 text-ink-muted">
              Usa este ID para enviar una donación mediante Binance Pay.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-ctl bg-brand px-4 py-3.5 text-sm font-bold text-white shadow-brand outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.98]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}