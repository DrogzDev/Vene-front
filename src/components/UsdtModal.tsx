import { useEffect } from "react"

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
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

      <div
        className="relative w-full max-w-lg rounded-t-3xl border border-[#27313d] bg-gradient-to-br from-[#161c24] via-[#11161d] to-[#0c1117] p-5 text-slate-100 shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">
            Ofertas USDT P2P
          </h3>

          <button
            onClick={onClose}
            className="rounded-full border border-[#2a3440] bg-[#151b23] p-2 transition hover:bg-[#1b222c]"
          >
            <svg
              className="h-5 w-5 text-slate-400"
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

        <p className="mb-4 text-sm text-slate-400">
          Mejor precio:{" "}
          <span className="font-semibold text-slate-100">
            Bs {bestPrice.toFixed(2)}
          </span>
        </p>

        <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
          {offers.map((offer, index) => (
            <div
              key={`${offer.nickName}-${index}`}
              className="rounded-2xl border border-[#27313d] bg-[#141a22] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    {offer.nickName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {offer.userIdentity || "Verificado"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {offer.payTypes.join(", ")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-100">
                    Bs {offer.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full border border-[#2a3440] bg-[#151b23] py-2.5 text-sm font-medium text-slate-200 transition hover:bg-[#1b222c]"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}