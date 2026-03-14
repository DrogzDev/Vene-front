import { useEffect, useMemo, useState } from "react"
import Header from "../components/Header"
import ConverterCard from "../components/ConverterCard"
import RateCard from "../components/RateCard"
import UsdtModal from "../components/UsdtModal"
import HistoryDatePicker from "../components/HistoryDatePicker"
import DonationsModal from "../components/donationsModal" // Asegúrate de importar el modal de donaciones
import {
  getDailyCloseHistory,
  getHomePrices,
  refreshHomePrices,
} from "../services/pricesApi"
import type { DailyCloseHistoryItem, PricesHomeData } from "../types/prices"
import { formatBs, formatDate, formatPercent } from "../utils/format"
import icon from "../assets/icon.svg"

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function Home() {
  const [data, setData] = useState<PricesHomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [usingCache, setUsingCache] = useState(false)
  const [cachedAt, setCachedAt] = useState<string | null>(null)

  const [history, setHistory] = useState<DailyCloseHistoryItem[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [historicalItem, setHistoricalItem] = useState<DailyCloseHistoryItem | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState("")

  const [donationsOpen, setDonationsOpen] = useState(false) // Estado para abrir el modal de donaciones

  async function loadData() {
    try {
      setError("")
      setLoading(true)

      const homeResult = await getHomePrices()

      setData(homeResult.data)
      setUsingCache(homeResult.fromCache)
      setCachedAt(homeResult.cachedAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos")
    } finally {
      setLoading(false)
    }
  }

  async function loadHistory() {
    try {
      const historyResult = await getDailyCloseHistory()
      setHistory(historyResult.data)
    } catch (err) {
      console.error("Error cargando historial:", err)
    }
  }

  async function handleRefresh() {
    try {
      setError("")
      setRefreshing(true)

      const homeResult = await refreshHomePrices()

      setData(homeResult.data)
      setUsingCache(false)
      setCachedAt(null)

      const historyResult = await getDailyCloseHistory()
      setHistory(historyResult.data)

      if (selectedDate) {
        const dateKey = toDateKey(selectedDate)
        const match = historyResult.data.find((item) => item.date === dateKey) || null
        setHistoricalItem(match)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando datos")
    } finally {
      setRefreshing(false)
    }
  }

  function handleHistoricalDateConfirm(date: Date | null) {
    setSelectedDate(date)
    setHistoryError("")

    if (!date) {
      setHistoricalItem(null)
      return
    }

    const dateKey = toDateKey(date)
    const match = history.find((item) => item.date === dateKey) || null

    if (!match) {
      setHistoricalItem(null)
      setHistoryError("No hay datos históricos guardados para esa fecha.")
      return
    }

    setHistoricalItem(match)
  }

  function clearHistoricalView() {
    setSelectedDate(null)
    setHistoricalItem(null)
    setHistoryError("")
  }

  useEffect(() => {
    async function init() {
      setHistoryLoading(true)
      try {
        await Promise.all([loadData(), loadHistory()])
      } finally {
        setHistoryLoading(false)
      }
    }

    init()
  }, [])

  const availableDates = useMemo(() => {
    return history.map((item) => item.date)
  }, [history])

  const displayData = useMemo(() => {
    if (!data) return null

    if (!historicalItem) return data

    return {
      ...data,
      bcv: {
        ...data.bcv,
        USD: historicalItem.bcv,
      },
      binance_best_price: historicalItem.binance_best_price,
      average_price: historicalItem.average_price,
      spread: {
        absolute: historicalItem.spread_absolute,
        percent: historicalItem.spread_percent,
      },
      updated_at: historicalItem.created_at || historicalItem.date,
    }
  }, [data, historicalItem])

  const rates = useMemo(() => {
    if (!displayData) return []

    return [
      {
        title: "Dólar BCV",
        price: "$ 1,00",
        rate: `Bs ${formatBs(displayData.bcv.USD)}`,
        change: formatPercent(displayData.spread.percent || 0),
        changeColor:
          (displayData.spread.percent || 0) >= 0 ? "text-emerald-600" : "text-red-600",
      },
      {
        title: "Euro BCV",
        price: "€ 1,00",
        rate: `Bs ${formatBs(displayData.bcv.EUR)}`,
        change: "BCV",
        changeColor: "text-gray-500",
      },
      {
        title: "USDT",
        price: "$ 1,00",
        rate: `Bs ${formatBs(displayData.binance_best_price)}`,
        change: data?.best_merchant?.nickName || "Binance",
        changeColor: "text-lime-600",
      },
      {
        title: "Promedio",
        price: "$ 1,00",
        rate: `Bs ${formatBs(displayData.average_price)}`,
        change: "BCV + Binance",
        changeColor: "text-sky-400",
      },
    ]
  }, [displayData, data])

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,#111218_0%,#15171d_100%)]">
        <img
          src={icon}
          alt="Loading..."
          className="h-14 w-14 animate-spin rounded-2xl"
        />
        <p className="text-sm text-[#8b92a0]">Cargando tasas...</p>
      </main>
    )
  }

  if (error && !data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,#111218_0%,#15171d_100%)]">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={loadData}
          className="rounded-full border border-[#2a2f38] bg-[#1a1d24] px-5 py-2 text-sm font-semibold text-[#e7e9ee]"
        >
          Reintentar
        </button>
      </main>
    )
  }

  if (!data || !displayData) return null

  return (
    <>
      <main className="min-h-screen bg-[linear-gradient(180deg,#111218_0%,#15171d_100%)] text-[#e7e9ee]">
        <div className="mx-auto w-full max-w-sm px-4 py-7">
          <Header onLogoClick={() => setDonationsOpen(true)} />

          {usingCache && !historicalItem && (
            <div className="mt-4 rounded-2xl border border-[#3a3340] bg-[#1a1820] px-4 py-3 text-xs text-[#c9b7d9]">
              Mostrando datos guardados{cachedAt ? ` · cacheado ${formatDate(cachedAt)}` : ""}
            </div>
          )}

          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

          <div className="mt-6">
            <ConverterCard
              usdRate={displayData.bcv.USD}
              eurRate={displayData.bcv.EUR}
              usdtRate={displayData.binance_best_price}
              averageRate={displayData.average_price}
            />
          </div>

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#e7e9ee]">Todas las tasas</h2>
                <p className="mt-1 text-xs text-[#7f8694]">
                  Última actualización: {formatDate(displayData.updated_at)}
                </p>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-full border border-[#2a2f38] bg-[#1a1d24] px-4 py-2 text-xs font-medium text-[#d7dbe3] disabled:opacity-60"
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
                  updatedAt={formatDate(displayData.updated_at)}
                  onClick={item.title === "USDT" ? () => setModalOpen(true) : undefined}
                />
              ))}
            </div>

            <HistoryDatePicker
              selectedDate={selectedDate}
              onConfirm={handleHistoricalDateConfirm}
              availableDates={availableDates}
              loading={historyLoading}
            />

            {selectedDate && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={clearHistoricalView}
                  className="text-xs text-[#8c98a5] transition hover:text-white"
                >
                  Volver a tiempo real
                </button>
              </div>
            )}

            {historyError && (
              <p className="mt-3 text-center text-xs text-amber-400">{historyError}</p>
            )}
          </section>
        </div>
      </main>

      <UsdtModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        offers={data.binance_simple.map((offer) => ({
          nickName: offer.nickName,
          price: offer.price,
          userIdentity: offer.identity || "",
          payTypes: offer.payTypes,
        }))}
        bestPrice={data.binance_best_price}
      />

      {/* Modal de donaciones */}
      <DonationsModal
        isOpen={donationsOpen}
        onClose={() => setDonationsOpen(false)}
      />
    </>
  )
}