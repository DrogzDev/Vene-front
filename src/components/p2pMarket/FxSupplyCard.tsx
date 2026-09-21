import type {
  FxSupplyContext,
  FxSupplyDayStats,
  FxSupplyInstitutionState,
  FxSupplyStatBlock,
} from "../../types/prices"
import { BankIcon } from "../priceHistory/icons"

type Props = {
  context: FxSupplyContext | null
  dayStats?: FxSupplyDayStats | null
}

type Line = {
  headline: string
  detail: string
  tone: string
}

/**
 * Cómo se lee cada estado.
 *
 * La distinción clave es entre "todavía no apareció" y "no apareció en
 * todo el día". Mientras el monitoreo siga abierto, la tarjeta dice
 * explícitamente hasta qué hora seguimos mirando, para que nadie lea
 * una ausencia definitiva donde solo hay una ausencia provisional.
 */
function describe(state: FxSupplyInstitutionState): Line {
  switch (state.status) {
    case "CONFIRMED":
      return {
        headline: state.first_event_time
          ? `Venta registrada · ${state.first_event_time}`
          : "Venta registrada",
        detail:
          state.event_count > 1
            ? `${state.event_count} activaciones hoy`
            : "En su horario habitual",
        tone: "#34d399",
      }

    case "CONFIRMED_EARLY":
      return {
        headline: state.first_event_time
          ? `Venta registrada · ${state.first_event_time}`
          : "Venta registrada",
        detail: "Antes de su ventana habitual",
        tone: "#34d399",
      }

    case "CONFIRMED_LATE":
      return {
        headline: state.first_event_time
          ? `Venta registrada · ${state.first_event_time}`
          : "Venta registrada",
        detail: "Fuera de ventana habitual",
        tone: "#34d399",
      }

    case "MONITORING":
      return {
        headline: "Sin registrar todavía",
        detail: `Dentro de su horario habitual`,
        tone: "#d7dbe3",
      }

    case "USUAL_WINDOW_MISSED":
      return {
        headline: "Sin evento habitual",
        detail: `Monitoreando hasta ${state.monitor_until}`,
        tone: "#f0b429",
      }

    case "EXPECTED_BUT_NOT_SEEN":
      return {
        headline: "Sin venta registrada hoy",
        detail: "Monitoreo completado",
        tone: "#f87171",
      }

    default:
      return {
        headline: "Sin información",
        detail: "Cobertura insuficiente del lector",
        tone: "#646d7d",
      }
  }
}

function formatPercent(value?: number) {
  if (value == null) return "—"

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

/**
 * Impacto histórico. Solo se dibuja cuando la muestra alcanza, y aun
 * así lleva escrito cuántas jornadas la sostienen: un porcentaje sin su
 * tamaño de muestra se lee como si fuera una predicción.
 */
function HistoricalImpact({ block }: { block: FxSupplyStatBlock }) {
  if (block.maturity === "insufficient") return null
  if (block.median_change_6h == null) return null

  const maturityNote =
    block.maturity === "preliminary"
      ? "Muestra todavía muy pequeña"
      : block.maturity === "limited"
        ? "Muestra corta"
        : "Muestra consolidada"

  return (
    <div className="mt-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#646d7d]">
        Impacto histórico
      </p>

      <p className="mt-1 text-xs text-[#8b93a3]">
        6H después de días sin evento
      </p>

      <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#d7dbe3]">
        {formatPercent(block.median_change_6h)} mediana
      </p>

      <p className="mt-1 text-[11px] text-[#4d5665]">
        {block.sample_size} jornadas observadas · {maturityNote}
      </p>
    </div>
  )
}

/**
 * "Oferta de divisas": estado de cada institución que publica ventas de
 * intervención digital, más su impacto histórico cuando hay muestra.
 *
 * Vive junto a "Estado del mercado" en el raíl de escritorio y debajo
 * del chart en móvil, con el mismo contenedor que el resto de tarjetas.
 */
export default function FxSupplyCard({ context, dayStats }: Props) {
  const entries = Object.values(context ?? {})

  if (entries.length === 0) return null

  const withoutEvent =
    dayStats?.full_day_without_event?.without_event ??
    dayStats?.usual_window_missed?.without_event

  return (
    <div className="rounded-[16px] border border-white/[0.06] bg-[#12151c] p-4">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#8b93a3]">
        <BankIcon className="h-3.5 w-3.5" />
        Oferta de divisas
      </h2>

      <div className="mt-1 divide-y divide-white/[0.05]">
        {entries.map((state) => {
          const line = describe(state)

          return (
            <div key={state.institution} className="py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs text-[#8b93a3]">{state.label}</span>
                <span
                  className="truncate text-sm font-semibold tabular-nums"
                  style={{ color: line.tone }}
                >
                  {line.headline}
                </span>
              </div>

              <p className="mt-0.5 text-right text-[11px] text-[#4d5665]">
                {line.detail}
              </p>
            </div>
          )
        })}
      </div>

      {withoutEvent && <HistoricalImpact block={withoutEvent} />}

      <p className="mt-2 text-[11px] leading-relaxed text-[#4d5665]">
        La ausencia de una venta durante su horario habitual es contexto
        del mercado, no una causa comprobada de los movimientos del P2P.
      </p>
    </div>
  )
}
