import { useEffect, useMemo, useState } from "react"

type ConverterMode = "USD" | "EUR" | "USDT" | "CUSTOM"

type ConverterCardProps = {
  usdRate: number
  eurRate: number
  usdtRate: number
}

const CUSTOM_RATE_STORAGE_KEY = "vex_custom_rate"

export default function ConverterCard({
  usdRate,
  eurRate,
  usdtRate,
}: ConverterCardProps) {
  const [amount, setAmount] = useState("1")
  const [mode, setMode] = useState<ConverterMode>("USD")
  const [customRate, setCustomRate] = useState("")

  useEffect(() => {
    const savedRate = localStorage.getItem(CUSTOM_RATE_STORAGE_KEY)
    if (savedRate) {
      setCustomRate(savedRate)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(CUSTOM_RATE_STORAGE_KEY, customRate)
  }, [customRate])

  const rate = useMemo(() => {
    if (mode === "USD") return usdRate
    if (mode === "EUR") return eurRate
    if (mode === "USDT") return usdtRate

    const parsed = Number(customRate)
    return parsed > 0 ? parsed : 0
  }, [mode, usdRate, eurRate, usdtRate, customRate])

  const numericAmount = Number(amount) || 0
  const bs = numericAmount * rate

  return (
    <section className="relative left-1/2 w-[min(90vw,26rem)] -translate-x-1/2 overflow-hidden rounded-[14px] border border-[#27313d] bg-gradient-to-br from-[#161c24] via-[#11161d] to-[#0c1117] p-3.5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      {/* glow superior suave */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(88,104,126,0.06),transparent_28%)]" />

      {/* creciente inferior inspirada en el svg */}
      <div className="pointer-events-none absolute -bottom-10 left-1/2 h-32 w-[100%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(164,55,68,0.20)_0%,rgba(115,64,108,0.14)_38%,rgba(70,93,146,0.10)_64%,rgba(22,28,36,0)_100%)] blur-2xl" />

      {/* segunda capa para que se vea más profunda */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-20 w-[100%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(138,44,58,0.10)_0%,rgba(91,61,108,0.06)_45%,rgba(18,24,32,0)_100%)] blur-xl" />

      <div className="relative z-10">
        <div className="mb-3 flex flex-wrap gap-1">
          {(
            [
              { key: "USD", label: "Dólar" },
              { key: "EUR", label: "Euro" },
              { key: "USDT", label: "USDT" },
              { key: "CUSTOM", label: "Personalizada" },
            ] as const
          ).map((item) => {
            const active = mode === item.key

            return (
              <button
                key={item.key}
                onClick={() => setMode(item.key)}
                className={`rounded-full px-2.5 py-1 text-[9px] font-semibold transition-all duration-200 ${
                  active
                    ? "border border-[#6d7d90] bg-[#74869a] text-white shadow-[0_4px_12px_rgba(116,134,154,0.15)]"
                    : "border border-[#27313d] bg-[#151b23]/90 text-[#8d9aa8] hover:border-[#344150] hover:bg-[#1a212b] hover:text-[#d9e1e8]"
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="space-y-2.5">
          <div>
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7f8b98]">
              Tengo ({mode === "CUSTOM" ? "Bs por unidad" : mode})
            </p>

            <div className="rounded-lg border border-[#2d3844] bg-[#171d25]/88 px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-xl font-semibold text-[#eef2f6] outline-none placeholder:text-[#556170]"
                placeholder="0"
              />
            </div>
          </div>

          {mode === "CUSTOM" ? (
            <div>
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7f8b98]">
                Tasa personalizada
              </p>

              <div className="rounded-lg border border-[#2d3844] bg-[#171d25]/88 px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm">
                <input
                  type="number"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className="w-full bg-transparent text-lg font-semibold text-[#eef2f6] outline-none placeholder:text-[#556170]"
                  placeholder="Ej: 72.50"
                />
              </div>

              <p className="mt-1 text-[9px] text-[#7f8b98]">
                Esta tasa se guarda en la app.
              </p>
            </div>
          ) : null}

          <div>
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7f8b98]">
              Recibo (Bs)
            </p>

            <div className="rounded-lg border border-[#31404d] bg-[#171d25]/92 px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm">
              <p className="text-xl font-semibold text-[#eef2f6]">
                Bs {bs.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}