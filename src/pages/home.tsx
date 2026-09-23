import { useState } from "react"
import { useNavigate } from "react-router-dom"

import AppShell from "../components/shell/AppShell"
import AppHeader from "../components/shell/AppHeader"
import AlertsModal from "../components/AlertsModal"
import UsdtModal from "../components/UsdtModal"
import DonationsModal from "../components/donationsModal"
import { Skeleton } from "../components/priceHistory/states"
import SegmentedControl from "../components/priceHistory/SegmentedControl"
import HomeHero from "../components/home/HomeHero"
import { HOME_RATE_OPTIONS } from "../components/home/homeRates"
import type { HomeRateMode } from "../components/home/homeRates"
import MarketNowList from "../components/home/MarketNowList"
import { useBankAlerts } from "../components/home/useBankAlerts"
import { useHomeMarket } from "../components/home/useHomeMarket"
import { useLatestAiAnalysis } from "../components/home/useLatestAiAnalysis"
import ActionTile from "../components/ui/ActionTile"
import AIInsightCard from "../components/ui/AIInsightCard"
import { VcIcon } from "../components/ui/VcIcon"

/** Serie del Historial que corresponde a la tasa elegida en Inicio. */
const HISTORY_SERIES: Record<HomeRateMode, string> = {
  USD: "bcv",
  EUR: "eur",
  USDT: "usdt",
  AVERAGE: "average",
}

function HomeSkeleton() {
  return (
    <AppShell>
      <div role="status" aria-label="Cargando tasas" className="space-y-4 pt-2">
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-[10px]" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
        <Skeleton className="h-11 rounded-ctl" />
        <Skeleton className="h-[150px] rounded-card" />
        <Skeleton className="h-[84px] rounded-card" />
        <Skeleton className="h-[120px] rounded-card" />
      </div>
    </AppShell>
  )
}

/**
 * Inicio.
 *
 * Lo principal cabe en la primera pantalla: una tasa protagonista, las
 * acciones rápidas y el resumen del mercado. El conversor completo vive
 * en su hoja (acción "Convertir"), no ocupando Inicio permanentemente.
 */
export default function Home() {
  const navigate = useNavigate()
  const market = useHomeMarket()
  const bank = useBankAlerts()
  const { analysis: latestAnalysis, stale: analysisStale } = useLatestAiAnalysis()

  const [mode, setMode] = useState<HomeRateMode>("USD")
  const [usdtOpen, setUsdtOpen] = useState(false)
  const [donationsOpen, setDonationsOpen] = useState(false)

  function openAnalysis() {
    navigate(`/usdt-analisis?ia=${latestAnalysis ? latestAnalysis.id : "nuevo"}`)
  }

  if (market.loading) return <HomeSkeleton />

  if (market.error && !market.data) {
    return (
      <AppShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-down">{market.error}</p>
          <button
            type="button"
            onClick={market.loadData}
            className="min-h-11 rounded-ctl border border-hair bg-surface px-5 text-sm font-semibold text-ink outline-none transition hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-95"
          >
            Reintentar
          </button>
        </div>
      </AppShell>
    )
  }

  const data = market.data
  const displayData = market.displayData

  if (!data || !displayData) return null

  return (
    <>
      <AppShell>
        <AppHeader
          variant="home"
          unreadCount={bank.unreadCount}
          alertsEnabled={bank.alertsEnabled}
          onBellClick={bank.openAlerts}
          onLogoClick={() => setDonationsOpen(true)}
        />

        {market.error && <p className="mb-2 break-words text-[12px] text-down">{market.error}</p>}

        <div className="space-y-3">
          <div data-enter>
            <SegmentedControl
              options={HOME_RATE_OPTIONS}
              value={mode}
              onChange={setMode}
              label="Tasa principal"
              size="sm"
            />
          </div>

          {/* El hero marca sus propias piezas con data-enter. */}
          <HomeHero mode={mode} data={displayData} market={market} />

          <nav
            data-enter
            aria-label="Acciones rápidas"
            className="grid grid-cols-4 gap-1 rounded-card border border-hair bg-surface p-1.5"
          >
            <ActionTile
              primary
              icon={<VcIcon name="convert-swap" className="h-5 w-5" />}
              label="Convertir"
              onClick={() => navigate(`/convertir?tasa=${mode}`)}
            />
            <ActionTile
              icon={<VcIcon name="market-candles" className="h-5 w-5" />}
              label="Mercado"
              accent="#1FBF9F"
              onClick={() => navigate("/usdt-analisis")}
            />
            <ActionTile
              icon={<VcIcon name="history-ring" className="h-5 w-5" />}
              label="Historial"
              accent="#3AA8FF"
              onClick={() => navigate(`/historial?series=${HISTORY_SERIES[mode]}`)}
            />
            <ActionTile
              icon={<VcIcon name="ai" className="h-5 w-5" />}
              label="IA"
              accent="#9D72FF"
              onClick={openAnalysis}
            />
          </nav>

          <div data-enter>
            <MarketNowList
              data={data}
              market={market}
              onSeeAll={() => navigate("/usdt-analisis")}
              onUsdtClick={() => setUsdtOpen(true)}
            />
          </div>

          <div data-enter>
            <AIInsightCard analysis={latestAnalysis} stale={analysisStale} onOpen={openAnalysis} />
          </div>
        </div>
      </AppShell>

      <AlertsModal
        isOpen={bank.alertsOpen}
        onClose={() => bank.setAlertsOpen(false)}
        alerts={bank.alerts}
        alertsEnabled={bank.alertsEnabled}
        onEnableAlerts={bank.enableAlerts}
        onDisableAlerts={bank.disableAlerts}
        onEnableSound={bank.enableAlertSound}
        alertsError={bank.alertsError}
      />

      <UsdtModal
        isOpen={usdtOpen}
        onClose={() => setUsdtOpen(false)}
        offers={data.binance_simple.map((offer) => ({
          nickName: offer.nickName,
          price: offer.price,
          userIdentity: offer.identity || "",
          payTypes: offer.payTypes,
        }))}
        bestPrice={data.binance_best_price}
      />

      <DonationsModal isOpen={donationsOpen} onClose={() => setDonationsOpen(false)} />
    </>
  )
}
