import { useEffect, useState } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Sun } from "lucide-react"

import AppShell from "../components/shell/AppShell"
import DotsAnimatedIcon from "../components/icons/DotsAnimatedIcon"
// Logo de cabecera (símbolo + wordmark en un solo PNG, generado por
// scripts/brand-assets.py). La variante clara oscurece solo el wordmark
// blanco y es PROVISIONAL hasta tener un logo oficial para fondo claro.
import logoDark from "../assets/branding/generated/header-v2-dark.png"
import logoLight from "../assets/branding/generated/header-v2-light.png"
import { useTheme } from "../theme/useTheme"
import { toggleThemeWithCircleReveal } from "../theme/viewTransition"
import AlertsBell, { RoundAction } from "../components/shell/AlertsBell"
import AlertsModal from "../components/AlertsModal"
import { useBankAlerts } from "../components/home/useBankAlerts"
import { CurrencyIcon } from "../components/ui/VcIcon"
import type { CurrencyIconName } from "../components/ui/VcIcon"
import ConverterCard from "../components/ConverterCard"
import { CONVERTER_MODES } from "../components/converterModes"
import type { ConverterMode } from "../components/converterModes"
import { useHomeMarket } from "../components/home/useHomeMarket"
import { Skeleton } from "../components/priceHistory/states"
import { JellyTabs } from "../components/ui/JellyTabs"
import { ListCard, ListRow } from "../components/ui/ListCard"
import Sparkline from "../components/ui/Sparkline"
import { Notice } from "../components/ui/primitives"
import { TONE_HEX, TONE_TEXT, formatSignedPercent, toneOf } from "../components/ui/tone"
import { formatBs, formatDate } from "../utils/format"

const VALID_MODES = new Set<ConverterMode>(CONVERTER_MODES.map((option) => option.key))

type MarketRow = {
  mode: Exclude<ConverterMode, "CUSTOM">
  icon: CurrencyIconName
  accent: string
  title: string
  subtitle: string
}

const MARKET_ROWS: MarketRow[] = [
  { mode: "USD", icon: "bcv", accent: "#3AA8FF", title: "Dólar BCV", subtitle: "Oficial" },
  { mode: "EUR", icon: "eur", accent: "#3AA8FF", title: "Euro BCV", subtitle: "Oficial" },
  { mode: "USDT", icon: "usdt", accent: "#1FBF9F", title: "USDT", subtitle: "Binance P2P" },
  { mode: "AVERAGE", icon: "average", accent: "#C9A86A", title: "Promedio", subtitle: "BCV + Binance" },
]

function initialMode(value: string | null): ConverterMode {
  return value && VALID_MODES.has(value as ConverterMode) ? (value as ConverterMode) : "USD"
}

/**
 * Convertir: calculadora financiera instantánea.
 *
 * Tasas en vivo de /prices/home/ (con su caché sin conexión) y, debajo,
 * las tasas del mercado con su variación contra el cierre anterior.
 * Tocar una tasa la usa en el conversor.
 */
export default function ConvertPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const bank = useBankAlerts()
  const { resolved: theme, setPreference: setThemePreference } = useTheme()

  function toggleTheme(event: ReactMouseEvent<HTMLButtonElement>) {
    toggleThemeWithCircleReveal({ x: event.clientX, y: event.clientY }, theme, setThemePreference)
  }

  // Tocar una notificación de alerta bancaria abre las alertas aquí.
  useEffect(() => {
    if (searchParams.get("alertas") !== "1") return

    bank.openAlerts()
    const next = new URLSearchParams(searchParams)
    next.delete("alertas")
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  const [mode, setMode] = useState<ConverterMode>(() => initialMode(searchParams.get("tasa")))
  const market = useHomeMarket()

  const data = market.data

  const rowData = {
    USD: { value: data?.bcv.USD, change: market.changes.bcv, trend: market.trends.bcv },
    EUR: { value: data?.bcv.EUR, change: market.changes.eur, trend: market.trends.eur },
    USDT: { value: data?.binance_best_price, change: market.changes.usdt, trend: market.trends.usdt },
    AVERAGE: { value: data?.average_price, change: market.changes.average, trend: market.trends.average },
  }

  return (
    <AppShell ambient>
      {/* Branding centrado: la campana y "Más" viven debajo, junto a las
          tasas, así que aquí no hace falta compartir la fila con nada. */}
      <div className="flex flex-col items-center pb-2 pt-3">
        <h1 className="sr-only">Convertir</h1>
        <img
          src={theme === "light" ? logoLight : logoDark}
          alt="Venecambio"
          width={560}
          height={120}
          draggable={false}
          className="h-[clamp(42px,12vw,54px)] w-auto max-w-[75%] select-none object-contain"
        />
      </div>

      <div className="space-y-3">
        <div className="flex justify-center">
          <JellyTabs options={CONVERTER_MODES} value={mode} onChange={setMode} label="Tasa" size="sm" />
        </div>

        {market.loading ? (
          <div role="status" aria-label="Cargando tasas" className="space-y-3">
            <Skeleton className="h-[236px] rounded-card" />
            <Skeleton className="h-[230px] rounded-card" />
          </div>
        ) : !data ? (
          <Notice tone="down">
            {market.error || "No se pudieron cargar las tasas."}{" "}
            <button type="button" onClick={market.loadData} className="font-semibold text-brand-light underline">
              Reintentar
            </button>
          </Notice>
        ) : (
          <>
            {market.usingCache && (
              <Notice tone="warn">
                Sin conexión: tasas guardadas{market.cachedAt ? ` · ${formatDate(market.cachedAt)}` : ""}
              </Notice>
            )}

            <ConverterCard
              usdRate={data.bcv.USD}
              eurRate={data.bcv.EUR}
              usdtRate={data.binance_best_price}
              averageRate={data.average_price}
              mode={mode}
              updatedAt={data.updated_at}
              onRefresh={market.refresh}
              refreshing={market.refreshing}
            />

            <section aria-label="Tasas del mercado">
              <ListCard>
                {MARKET_ROWS.map((row) => {
                  const info = rowData[row.mode]
                  const tone = toneOf(info.change)

                  return (
                    <ListRow
                      key={row.mode}
                      media={<CurrencyIcon name={row.icon} className="h-9 w-9" />}
                      accent={row.accent}
                      title={row.title}
                      subtitle={row.subtitle}
                      selected={mode === row.mode}
                      onClick={() => setMode(row.mode)}
                      right={
                        <>
                          <Sparkline
                            values={info.trend}
                            color={info.change == null ? row.accent : TONE_HEX[tone]}
                            width={44}
                            height={18}
                          />
                          <span className="w-[88px] shrink-0 text-right">
                            <span className="block truncate text-[14px] font-bold tabular-nums text-ink">
                              {info.value == null ? "—" : `Bs ${formatBs(info.value)}`}
                            </span>
                            {info.change != null && (
                              <span className={`block text-[12px] font-semibold tabular-nums ${TONE_TEXT[tone]}`}>
                                {formatSignedPercent(info.change)}
                              </span>
                            )}
                          </span>
                        </>
                      }
                    />
                  )
                })}
              </ListCard>

            </section>
          </>
        )}

        {/* Alertas bancarias, Más y el tema, juntos bajo las tasas. */}
        <nav aria-label="Alertas y ajustes" className="flex justify-center gap-8 pt-2">
          <AlertsBell
            unreadCount={bank.unreadCount}
            alertsEnabled={bank.alertsEnabled}
            onClick={bank.openAlerts}
          />
          <RoundAction label="Más" ariaLabel="Más: ajustes y preferencias" onClick={() => navigate("/mas")}>
            <DotsAnimatedIcon className="h-[22px] w-[22px]" onceKey="convert-more" delay={0.3} />
          </RoundAction>
          <RoundAction
            label="Tema"
            ariaLabel={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
            onClick={toggleTheme}
          >
            <Sun className="h-[22px] w-[22px]" strokeWidth={2} />
          </RoundAction>
        </nav>
      </div>

      {/* Solo se abre al tocar la campana o al llegar desde una
          notificación de alerta (?alertas=1), nunca solo al arrancar. */}
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
    </AppShell>
  )
}
