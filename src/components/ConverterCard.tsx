import { useEffect, useMemo, useState } from "react"

type ConverterMode = "USD" | "EUR" | "USDT" | "AVERAGE" | "CUSTOM"

type ConverterCardProps = {
  usdRate: number
  eurRate: number
  usdtRate: number
  averageRate: number
}

const CUSTOM_RATE_STORAGE_KEY = "vex_custom_rate"

export default function ConverterCard({
  usdRate,
  eurRate,
  usdtRate,
  averageRate,
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
    if (mode === "AVERAGE") return averageRate

    const parsed = Number(customRate)
    return parsed > 0 ? parsed : 0
  }, [mode, usdRate, eurRate, usdtRate, averageRate, customRate])

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
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {(
            [
              { key: "USD", label: "Dólar" },
              { key: "EUR", label: "Euro" },
              { key: "USDT", label: "USDT" },
              { key: "AVERAGE", label: "Promedio" },
              { key: "CUSTOM", label: "Personalizada" },
            ] as const
          ).map((item) => {
            const active = mode === item.key

            return (
              <button
                key={item.key}
                onClick={() => setMode(item.key)}
                className={`rounded-xl px-3 py-1.5 text-[10px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-[#4a5568] to-[#2d3748] text-white shadow-[0_4px_16px_rgba(74,85,104,0.25)] border border-[#4a5568]/50"
                    : "bg-[#1a1f2e]/60 text-[#94a3b8] border border-[#2d3748]/30 hover:bg-[#2d3748]/40 hover:text-[#e2e8f0] hover:border-[#4a5568]/50"
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="space-y-2">
          <div>
            <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.15em] text-[#64748b]">
              Tengo ({mode === "CUSTOM" ? "Bs por unidad" : mode})
            </p>

            <div className="rounded-lg border border-[#2d3748]/40 bg-[#0f1419]/80 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-lg font-semibold text-[#f1f5f9] outline-none placeholder:text-[#475569]"
                placeholder="0"
              />
            </div>
          </div>

          {mode === "CUSTOM" ? (
            <div>
              <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.15em] text-[#64748b]">
                Tasa personalizada
              </p>

              <div className="rounded-lg border border-[#2d3748]/40 bg-[#0f1419]/80 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm">
                <input
                  type="number"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className="w-full bg-transparent text-base font-semibold text-[#f1f5f9] outline-none placeholder:text-[#475569]"
                  placeholder="Ej: 72.50"
                />
              </div>

              <p className="mt-1 text-[8px] text-[#64748b]">
                Esta tasa se guarda en la app.
              </p>
            </div>
          ) : null}

          <div>
            <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.15em] text-[#64748b]">
              Recibo (Bs)
            </p>

            <div className="rounded-lg border border-[#2d3748]/40 bg-[#0f1419]/80 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm">
              <p className="text-lg font-semibold text-[#f1f5f9]">
                Bs {bs.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}