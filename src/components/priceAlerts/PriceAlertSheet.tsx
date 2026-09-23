import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import {
  ArrowDown,
  ArrowUp,
  Bell,
  ChartColumn,
  Check,
  Clock,
  Loader2,
  Pause,
  Play,
  Repeat,
  Target,
  Trash2,
} from "lucide-react"

import ResponsiveSheet from "../shared/ResponsiveSheet"
import { Toggle } from "../settings/SettingsList"
import { notificationService, type PushState } from "../../services/notifications"
import {
  createPriceAlert,
  deletePriceAlert,
  formatAmount,
  parseAmountInput,
  PriceAlertsError,
  togglePriceAlert,
  updatePriceAlert,
  type CurrentPricesResponse,
  type PriceAlert,
  type PriceAlertFrequency,
  type PriceAlertOperator,
  type PriceAlertSource,
} from "../../services/priceAlerts"
import { formatRelativeFromNow } from "../../utils/format"
import { SOURCE_META, SOURCE_ORDER } from "./alertMeta"

type Props = {
  open: boolean
  onClose: () => void
  /** null = crear; una alerta = editar. */
  alert: PriceAlert | null
  currentPrices: CurrentPricesResponse | null
  onSaved: () => void
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint first:mt-0">
      {children}
    </p>
  )
}

function Choice({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-ctl border px-3 text-[13px] font-semibold outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.98] ${
        active
          ? "border-brand bg-brand/15 text-ink"
          : "border-hair bg-surface-raised text-ink-muted hover:text-ink-soft"
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

export default function PriceAlertSheet({ open, onClose, alert, currentPrices, onSaved }: Props) {
  const editing = alert !== null

  const [source, setSource] = useState<PriceAlertSource>("USDT")
  const [operator, setOperator] = useState<PriceAlertOperator>("GTE")
  const [amount, setAmount] = useState("")
  const [frequency, setFrequency] = useState<PriceAlertFrequency>("ONCE")
  const [pushEnabled, setPushEnabled] = useState(true)
  const [useMarketContext, setUseMarketContext] = useState(false)

  const [pushState, setPushState] = useState<PushState>("disabled")
  const [pushBusy, setPushBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  // Confirmación breve tras guardar; después se cierra el sheet.
  const [saved, setSaved] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const [error, setError] = useState("")
  const [amountError, setAmountError] = useState("")

  // Cada apertura parte del estado de la alerta (o de uno limpio).
  useEffect(() => {
    if (!open) return

    setSource(alert?.source ?? "USDT")
    setOperator(alert?.operator ?? "GTE")
    setAmount(alert ? formatAmount(alert.target_price) : "")
    setFrequency(alert?.frequency ?? "ONCE")
    setPushEnabled(alert?.push_enabled ?? true)
    setUseMarketContext(alert?.use_market_context ?? false)
    setError("")
    setAmountError("")
    setSaved(false)

    notificationService.getState().then(setPushState).catch(() => setPushState("unsupported"))
  }, [open, alert])

  const current = currentPrices?.prices[source] ?? null
  const parsedAmount = parseAmountInput(amount)

  // Aviso honesto: si el precio YA cumple la condición, la alerta no
  // salta al crearla; espera a que salga de la zona y vuelva a cruzar.
  const alreadyInZone =
    current !== null &&
    parsedAmount !== null &&
    (operator === "GTE"
      ? Number(current.price) >= Number(parsedAmount)
      : Number(current.price) <= Number(parsedAmount))

  async function enableDevicePush() {
    setPushBusy(true)
    setError("")

    try {
      await notificationService.enable()
      setPushState(await notificationService.getState())
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron activar las notificaciones.")
    } finally {
      setPushBusy(false)
    }
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    }
  }, [])

  /**
   * `confirm`: al guardar se muestra "Alerta guardada" ~800 ms antes de
   * cerrar. Pausar o eliminar cierran directamente.
   */
  async function run(action: () => Promise<unknown>, { confirm = false }: { confirm?: boolean } = {}) {
    setSaving(true)
    setError("")

    try {
      await action()
      onSaved()

      if (confirm) {
        setSaved(true)
        closeTimer.current = window.setTimeout(() => {
          closeTimer.current = null
          onClose()
        }, 800)
      } else {
        onClose()
      }
    } catch (err) {
      if (err instanceof PriceAlertsError) {
        setAmountError(err.fieldErrors.target_price?.[0] ?? "")
        setError(err.fieldErrors.target_price ? "" : err.message)
      } else {
        setError("No se pudo guardar la alerta.")
      }
    } finally {
      setSaving(false)
    }
  }

  function save() {
    if (!parsedAmount) {
      setAmountError("Escribe un monto válido, por ejemplo 970,00.")
      return
    }

    const input = {
      source,
      operator,
      target_price: parsedAmount,
      frequency,
      push_enabled: pushEnabled,
      use_market_context: useMarketContext,
    }

    run(() => (alert ? updatePriceAlert(alert.id, input) : createPriceAlert(input)), { confirm: true })
  }

  const pushReady = pushState === "enabled"

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      title={editing ? "Editar alerta" : "Nueva alerta"}
      subtitle="Crea una alerta de precio"
      icon={
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/15 text-brand-light">
          <Target className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </span>
      }
      footer={
        <div className="w-full">
          <button
            type="button"
            onClick={save}
            disabled={saving || saved}
            aria-live="polite"
            className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-ctl text-[15px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand/60 active:scale-[0.99] ${
              saved
                ? "bg-up/15 text-up"
                : "bg-brand text-white hover:bg-brand-bright disabled:opacity-60"
            }`}
          >
            {saved ? (
              <>
                <Check className="h-[18px] w-[18px]" strokeWidth={2.6} aria-hidden />
                Alerta guardada
              </>
            ) : saving ? (
              <>
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
                Guardando…
              </>
            ) : (
              "Guardar alerta"
            )}
          </button>

          {editing && alert && (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={saving || saved}
                onClick={() => run(() => togglePriceAlert(alert.id))}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-ctl border border-hair bg-surface-raised text-[13px] font-semibold text-ink-soft outline-none transition hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-60"
              >
                {alert.is_active ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                {alert.is_active ? "Pausar" : "Reactivar"}
              </button>
              <button
                type="button"
                disabled={saving || saved}
                onClick={() => run(() => deletePriceAlert(alert.id))}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-ctl border border-down/30 bg-down/10 text-[13px] font-semibold text-down outline-none transition hover:bg-down/15 focus-visible:ring-2 focus-visible:ring-down/50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Eliminar
              </button>
            </div>
          )}
        </div>
      }
    >
      <div className="mb-5 flex items-start gap-3 rounded-tile border border-hair bg-surface-raised px-4 py-3">
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-brand-light" aria-hidden />
        <p className="text-[12px] leading-relaxed text-ink-muted">
          Te avisaremos cuando se cumpla tu condición y recibirás una notificación push en tu dispositivo.
        </p>
      </div>

      <Label>Fuente del precio</Label>
      <div role="radiogroup" aria-label="Fuente del precio" className="flex gap-2">
        {SOURCE_ORDER.map((key) => {
          const meta = SOURCE_META[key]
          const Icon = meta.icon

          return (
            <Choice
              key={key}
              active={source === key}
              onClick={() => setSource(key)}
              icon={<Icon className="h-4 w-4" style={{ color: meta.accent }} aria-hidden />}
            >
              {meta.label}
            </Choice>
          )
        })}
      </div>

      <Label>Condición</Label>
      <div role="radiogroup" aria-label="Condición" className="flex gap-2">
        <Choice active={operator === "GTE"} onClick={() => setOperator("GTE")} icon={<ArrowUp className="h-4 w-4" aria-hidden />}>
          Llegue o supere
        </Choice>
        <Choice active={operator === "LTE"} onClick={() => setOperator("LTE")} icon={<ArrowDown className="h-4 w-4" aria-hidden />}>
          Baje a
        </Choice>
      </div>

      <Label>Monto objetivo</Label>
      <label
        className={`flex min-h-12 items-center gap-2 rounded-ctl border bg-surface-raised px-4 focus-within:ring-2 focus-within:ring-brand/50 ${
          amountError ? "border-down/60" : "border-hair"
        }`}
      >
        <span className="text-[15px] font-semibold text-ink-muted">Bs</span>
        <input
          inputMode="decimal"
          autoComplete="off"
          placeholder="970,00"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value)
            setAmountError("")
          }}
          aria-label="Monto objetivo en bolívares"
          aria-invalid={Boolean(amountError)}
          className="min-w-0 flex-1 bg-transparent text-[20px] font-semibold tabular-nums text-ink outline-none placeholder:text-ink-faint"
        />
      </label>

      {amountError ? (
        <p className="mt-1.5 text-[12px] text-down">{amountError}</p>
      ) : (
        <p className="mt-1.5 text-[12px] text-ink-muted">
          {current
            ? `Precio actual: Bs ${formatAmount(current.price)}${
                current.observed_at ? ` · ${formatRelativeFromNow(current.observed_at)}` : ""
              }`
            : "No hay un precio reciente de esta fuente."}
        </p>
      )}

      {alreadyInZone && !amountError && (
        <p className="mt-1 text-[12px] leading-snug text-warn">
          El precio actual ya cumple esta condición. Te avisaremos cuando salga y vuelva a cruzar el objetivo.
        </p>
      )}

      <Label>Frecuencia</Label>
      <div role="radiogroup" aria-label="Frecuencia" className="flex gap-2">
        <Choice active={frequency === "ONCE"} onClick={() => setFrequency("ONCE")} icon={<Clock className="h-4 w-4" aria-hidden />}>
          Una vez
        </Choice>
        <Choice active={frequency === "REPEAT"} onClick={() => setFrequency("REPEAT")} icon={<Repeat className="h-4 w-4" aria-hidden />}>
          Repetir
        </Choice>
      </div>
      {frequency === "REPEAT" && (
        <p className="mt-1.5 text-[12px] leading-snug text-ink-muted">
          Vuelve a avisarte cuando el precio salga de la zona y la cruce otra vez, con al menos{" "}
          {currentPrices?.limits.default_cooldown_minutes ?? 30} minutos entre avisos.
        </p>
      )}

      <Label>Notificación</Label>
      <div className="flex min-h-12 items-center gap-3 rounded-ctl border border-hair bg-surface-raised px-4 py-2.5">
        <Bell className="h-4 w-4 shrink-0 text-brand-light" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink">Push</p>
          <p className="text-[12px] leading-snug text-ink-muted">
            {pushReady
              ? "Recibir en este dispositivo"
              : pushState === "denied"
                ? "Las notificaciones están bloqueadas en este dispositivo."
                : pushState === "unsupported"
                  ? "Este navegador no admite notificaciones push."
                  : "Las notificaciones de este dispositivo están desactivadas."}
          </p>
        </div>
        {pushReady ? (
          <Toggle checked={pushEnabled} onChange={() => setPushEnabled((value) => !value)} label="Enviar push para esta alerta" />
        ) : pushState === "disabled" ? (
          <button
            type="button"
            onClick={enableDevicePush}
            disabled={pushBusy}
            className="min-h-11 shrink-0 rounded-ctl bg-brand/15 px-3 text-[13px] font-semibold text-brand-light outline-none transition hover:bg-brand/25 focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-60"
          >
            {pushBusy ? "Activando…" : "Activar"}
          </button>
        ) : null}
      </div>
      {notificationService.sharesBankAlertsSubscription && !pushReady && pushState === "disabled" && (
        <p className="mt-1.5 text-[12px] leading-snug text-ink-muted">
          En el navegador, activar el push también activa las alertas bancarias.
        </p>
      )}

      <Label>Opciones avanzadas</Label>
      <div className="flex min-h-12 items-center gap-3 rounded-ctl border border-hair bg-surface-raised px-4 py-2.5">
        <ChartColumn className="h-4 w-4 shrink-0 text-brand-light" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink">Usar análisis del mercado</p>
          <p className="text-[12px] leading-snug text-ink-muted">
            Añade contexto (variación y tendencia) a la notificación. No cambia la condición.
          </p>
        </div>
        <Toggle
          checked={useMarketContext}
          onChange={() => setUseMarketContext((value) => !value)}
          label="Usar análisis del mercado"
        />
      </div>

      {error && <p className="mt-4 text-[12px] leading-relaxed text-down">{error}</p>}

      <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-faint">
        La alerta se activa cuando el precio cruza el objetivo y envía una notificación push.
      </p>
    </ResponsiveSheet>
  )
}
