import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import AppShell from "../components/shell/AppShell"
import AppHeader from "../components/shell/AppHeader"
import { CurrencyIcon, VcIcon } from "../components/ui/VcIcon"
import type { CurrencyIconName } from "../components/ui/VcIcon"
import ConverterCard from "../components/ConverterCard"
import { CONVERTER_MODES } from "../components/converterModes"
import type { ConverterMode } from "../components/converterModes"
import { useHomeMarket } from "../components/home/useHomeMarket"
import { Skeleton } from "../components/priceHistory/states"
import { ListCard, ListRow } from "../components/ui/ListCard"
import Sparkline from "../components/ui/Sparkline"
import { ChipScroller, Notice, SectionHeader, SeeAllButton } from "../components/ui/primitives"
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
  { mode: "AVERAGE", icon: "average", accent: "#9D72FF", title: "Promedio", subtitle: "BCV + Binance" },
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
  const [searchParams] = useSearchParams()
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
    <AppShell>
      <AppHeader variant="tab" icon={<VcIcon name="convert-swap" className="h-[18px] w-[18px]" />} title="Convertir" subtitle="Calculadora instantánea" />

      <div className="space-y-3">
        <ChipScroller options={CONVERTER_MODES} value={mode} onChange={setMode} label="Tasa" size="sm" />

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
            />

            <section aria-label="Tasas del mercado">
              <SectionHeader
                title="Tasas del mercado"
                action={<SeeAllButton label="Ver mercado" onClick={() => navigate("/usdt-analisis")} />}
              />

              <ListCard className="mt-1.5">
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

              <p className="mt-2 px-1 text-[11px] text-ink-faint">Variación contra el cierre anterior guardado.</p>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
