import { useEffect, useMemo, useState } from "react"
import Header from "../components/Header"
import ConverterCard from "../components/ConverterCard"
import RateCard from "../components/RateCard"
import UsdtModal from "../components/UsdtModal"
import { getHomePrices, refreshHomePrices } from "../services/pricesApi"
import type { PricesHomeData } from "../types/prices"
import { formatBs, formatDate, formatPercent } from "../utils/format"

export default function Home() {
  const [data, setData] = useState<PricesHomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)

  async function loadData() {
    try {
      setError("")
      setLoading(true)
      const result = await getHomePrices()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos")
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    try {
      setError("")
      setRefreshing(true)
      const result = await refreshHomePrices()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando datos")
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const rates = useMemo(() => {
    if (!data) return []

    return [
      {
        title: "Dólar BCV",
        price: "$ 1,00",
        rate: `Bs ${formatBs(data.bcv.USD)}`,
        change: formatPercent(data.spread.percent),
        changeColor:
          data.spread.percent >= 0 ? "text-emerald-400" : "text-red-400",
      },
      {
        title: "Euro BCV",
        price: "€ 1,00",
        rate: `Bs ${formatBs(data.bcv.EUR)}`,
        change: "BCV",
        changeColor: "text-[#7f8694]",
      },
      {
        title: "USDT",
        price: "$ 1,00",
        rate: `Bs ${formatBs(data.binance_best_price)}`,
        change: data.best_merchant.nickName,
        changeColor: "text-[#a5adba]",
        offers: data.binance_simple,
      },
    ]
  }, [data])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#111218]">
        <p className="text-sm text-[#8b92a0]">Cargando tasas...</p>
      </main>
    )
  }

  if (error && !data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#111218]">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={loadData}
          className="rounded-full border border-[#2a2f38] bg-[#1a1d24] px-5 py-2 text-sm font-semibold text-[#e7e9ee] transition-colors hover:bg-[#20242d]"
        >
          Reintentar
        </button>
      </main>
    )
  }

  if (!data) return null

  return (
    <>
      <main className="min-h-screen bg-[linear-gradient(180deg,#111218_0%,#15171d_100%)] text-[#e7e9ee]">
        <div className="mx-auto w-full max-w-sm px-4 py-7">
          <Header />

          {error && (
            <p className="mt-3 animate-fade-up text-xs text-red-400">{error}</p>
          )}

          <div className="mt-6 animate-fade-up-delayed">
            <ConverterCard
              usdRate={data.bcv.USD}
              eurRate={data.bcv.EUR}
              usdtRate={data.binance_best_price}
            />
          </div>

          <section className="mt-8 animate-fade-up-delayed-2">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#e7e9ee]">
                  Todas las tasas
                </h2>
                <p className="mt-1 text-xs text-[#7f8694]">
                  Última actualización: {formatDate(data.updated_at)}
                </p>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-full border border-[#2a2f38] bg-[#1a1d24] px-4 py-2 text-xs font-medium text-[#d7dbe3] transition-colors hover:bg-[#20242d] disabled:opacity-60"
              >
                {refreshing ? "Actualizando..." : "Actualizar"}
              </button>
            </div>

            <div className="space-y-3">
              {rates.map((item) => (
                <RateCard
                  key={item.title}
                  title={item.title}
                  price={item.price}
                  rate={item.rate}
                  change={item.change}
                  changeColor={item.changeColor}
                  updatedAt={formatDate(data.updated_at)}
                  onClick={
                    item.title === "USDT" ? () => setModalOpen(true) : undefined
                  }
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      {data && (
        <UsdtModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          offers={data.binance_simple}
          bestPrice={data.binance_best_price}
        />
      )}
    </>
  )
}