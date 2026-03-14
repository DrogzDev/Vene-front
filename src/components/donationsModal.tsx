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
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[32px] border border-slate-200 bg-[#f8f9fb] p-5 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.16)] sm:p-6"
      >
        <div className="mb-4 flex justify-center sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-300" />
        </div>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Donaciones
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Si te gusta la app, puedes apoyarla aquí de forma rápida y sencilla.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
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
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
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
              className="block break-all text-sm font-medium text-slate-900 transition hover:text-slate-700 hover:underline"
            >
              paypal.me/Joncitodonameporfavo
            </a>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Haz clic en el enlace para donar directamente por PayPal.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Binance Pay
              </div>

              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-600">
                USDT
              </span>
            </div>

            <p className="text-sm text-slate-500">ID de pago</p>
            <p className="mt-1 text-lg font-semibold tracking-wide text-slate-900">
              74982558
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Usa este ID para enviar una donación mediante Binance Pay.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}