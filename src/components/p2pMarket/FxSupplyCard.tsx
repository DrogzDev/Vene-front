import { useId, useState } from "react"
import { ChevronDown } from "lucide-react"

import type {
  FxSupplyContext,
  FxSupplyDayStats,
  FxSupplyInstitutionState,
  FxSupplyStatBlock,
} from "../../types/prices"
import { BankIcon } from "../priceHistory/icons"
import { TONE_HEX } from "../ui/tone"

type Props = {
  /** Sin card ni título propios: va dentro de un bloque plegable. */
  embedded?: boolean
  /**
   * Plegable (móvil): cerrada muestra una línea por institución; al
   * abrirla aparecen el detalle, el impacto histórico y la nota.
   */
  collapsible?: boolean
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
        tone: TONE_HEX.up,
      }

    case "CONFIRMED_EARLY":
      return {
        headline: state.first_event_time
          ? `Venta registrada · ${state.first_event_time}`
          : "Venta registrada",
        detail: "Antes de su ventana habitual",
        tone: TONE_HEX.up,
      }

    case "CONFIRMED_LATE":
      return {
        headline: state.first_event_time
          ? `Venta registrada · ${state.first_event_time}`
          : "Venta registrada",
        detail: "Fuera de ventana habitual",
        tone: TONE_HEX.up,
      }

    case "MONITORING":
      return {
        headline: "Sin registrar todavía",
        detail: `Dentro de su horario habitual`,
        tone: "rgb(var(--c-text-soft))",
      }

    case "USUAL_WINDOW_MISSED":
      return {
        headline: "Sin evento habitual",
        detail: `Monitoreando hasta ${state.monitor_until}`,
        tone: "rgb(var(--c-warning))",
      }

    case "EXPECTED_BUT_NOT_SEEN":
      return {
        headline: "Sin venta registrada hoy",
        detail: "Monitoreo completado",
        tone: TONE_HEX.down,
      }

    default:
      return {
        headline: "Sin información",
        detail: "Cobertura insuficiente del lector",
        tone: "rgb(var(--c-text-muted))",
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
    <div className="mt-3 rounded-tile bg-surface-raised px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint">
        Impacto histórico
      </p>

      <p className="mt-1 text-xs text-ink-muted">
        6H después de días sin evento
      </p>

      <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink-soft">
        {formatPercent(block.median_change_6h)} mediana
      </p>

      <p className="mt-1 text-[11px] text-ink-faint">
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
export default function FxSupplyCard({ context, dayStats, embedded = false, collapsible = false }: Props) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const entries = Object.values(context ?? {})

  if (entries.length === 0) return null

  const withoutEvent =
    dayStats?.full_day_without_event?.without_event ??
    dayStats?.usual_window_missed?.without_event

  return (
    <div className={embedded ? "" : "rounded-card border border-hair bg-surface p-4"}>
      {!embedded && !collapsible && (
        <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
          <BankIcon className="h-3.5 w-3.5" />
          Oferta de divisas
        </h2>
      )}

      {collapsible && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="-mx-4 -mt-4 flex w-[calc(100%+2rem)] items-center justify-between gap-3 px-4 pb-1 pt-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/40"
        >
          <span className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-ink">
            <BankIcon className="h-4 w-4 text-ink-muted" />
            Oferta de divisas
          </span>
          <span className="flex min-h-9 items-center gap-0.5 text-[13px] font-medium text-ink-muted">
            {open ? "Ocultar" : "Ver detalle"}
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
          </span>
        </button>
      )}

      <div className="mt-1 divide-y divide-hair">
        {entries.map((state) => {
          const line = describe(state)

          return (
            <div key={state.institution} className="py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs text-ink-muted">{state.label}</span>
                <span
                  className="truncate text-sm font-semibold tabular-nums"
                  style={{ color: line.tone }}
                >
                  {line.headline}
                </span>
              </div>

              {(!collapsible || open) && (
                <p className="mt-0.5 text-right text-[11px] text-ink-faint">
                  {line.detail}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {(!collapsible || open) && (
        <div id={panelId} className={collapsible ? "motion-safe:animate-fade-in-fast" : undefined}>
          {withoutEvent && <HistoricalImpact block={withoutEvent} />}

          <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
            La ausencia de una venta durante su horario habitual es contexto
            del mercado, no una causa comprobada de los movimientos del P2P.
          </p>
        </div>
      )}
    </div>
  )
}
