import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ChevronRight,
  Heart,
  Info,
  Menu,
  Plus,
  Smartphone,
  Volume2,
} from "lucide-react"

import AppShell from "../components/shell/AppShell"
import AppHeader from "../components/shell/AppHeader"
import { VcIcon } from "../components/ui/VcIcon"
import SegmentedControl from "../components/priceHistory/SegmentedControl"
import DonationsModal from "../components/donationsModal"
import PriceAlertRow from "../components/priceAlerts/PriceAlertRow"
import PriceAlertSheet from "../components/priceAlerts/PriceAlertSheet"
import { usePriceAlerts } from "../components/priceAlerts/usePriceAlerts"
import { Row, Section, Toggle } from "../components/settings/SettingsList"
import {
  areBankAlertsEnabled,
  disableBankAlerts,
  enableBankAlerts,
  isRetryablePushError,
} from "../services/bankAlertsPush"
import { notificationService, type PushState } from "../services/notifications"
import type { PriceAlert } from "../services/priceAlerts"
import { getStoredViewMode, setStoredViewMode } from "../utils/viewMode"
import type { P2PViewMode } from "../types/prices"

const ALERTS_ENABLED_KEY = "bancamiga_alerts_enabled"
const ALERT_SOUND_ENABLED_KEY = "bancamiga_alert_sound_enabled"
const ALERT_SOUND_URL = "/sounds/bancamiga-alert.mp3"

// Filas visibles en Más; el resto vive en "Ver todas".
const ALERTS_PREVIEW_LIMIT = 3

const VIEW_OPTIONS: { key: P2PViewMode; label: string }[] = [
  { key: "simple", label: "Simple" },
  { key: "pro", label: "Profesional" },
]

/**
 * Pantalla "Más".
 *
 * Reúne ajustes que ya existían pero estaban escondidos: las
 * notificaciones solo se podían tocar dentro del modal de alertas, la
 * vista Simple/Profesional solo desde un toggle dentro del mercado, y
 * las donaciones solo pulsando el logo, cosa que nada indicaba. Ahora
 * también las alertas de precio.
 */
export default function MorePage() {
  const navigate = useNavigate()

  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState("")
  // Qué acción reintentar si el último error fue transitorio (FCM).
  const [retryAction, setRetryAction] = useState<null | "bank" | "device">(null)

  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem(ALERT_SOUND_ENABLED_KEY) === "true"
  )

  const [devicePush, setDevicePush] = useState<PushState>("disabled")
  const [devicePushBusy, setDevicePushBusy] = useState(false)

  const [viewMode, setViewMode] = useState<P2PViewMode>(() => getStoredViewMode())
  const [donationsOpen, setDonationsOpen] = useState(false)

  const { alerts, currentPrices, loading, error: alertsError, reload } = usePriceAlerts()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null)

  const sharedWebPush = notificationService.sharesBankAlertsSubscription

  useEffect(() => {
    let cancelled = false

    async function restore() {
      notificationService
        .getState()
        .then((state) => {
          if (!cancelled) setDevicePush(state)
        })
        .catch(() => {
          if (!cancelled) setDevicePush("unsupported")
        })

      // Web: suscripción del navegador. APK: permiso + token registrado +
      // bank_alerts confirmado por el servidor (bankAlertsPush).
      try {
        const enabled = await areBankAlertsEnabled()

        if (!cancelled) setPushEnabled(enabled)
      } catch {
        if (!cancelled) setPushEnabled(false)
      }
    }

    restore()

    return () => {
      cancelled = true
    }
  }, [])

  async function togglePush() {
    setPushBusy(true)
    setPushError("")
    setRetryAction(null)

    try {
      if (pushEnabled) {
        await disableBankAlerts()
        setPushEnabled(false)
        localStorage.removeItem(ALERTS_ENABLED_KEY)
        localStorage.removeItem(ALERT_SOUND_ENABLED_KEY)
        setSoundEnabled(false)
      } else {
        await enableBankAlerts()
        setPushEnabled(true)
        localStorage.setItem(ALERTS_ENABLED_KEY, "true")
      }

      setDevicePush(await notificationService.getState())
    } catch (err) {
      setPushError(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar el estado de las notificaciones."
      )
      if (isRetryablePushError(err)) setRetryAction("bank")
    } finally {
      setPushBusy(false)
    }
  }

  async function toggleDevicePush() {
    setDevicePushBusy(true)
    setPushError("")
    setRetryAction(null)

    try {
      if (devicePush === "enabled") {
        await notificationService.disable()
      } else {
        await notificationService.enable()
      }

      const state = await notificationService.getState()
      setDevicePush(state)

      // En web es la misma suscripción que "Alertas bancarias".
      if (sharedWebPush) {
        setPushEnabled(state === "enabled")
        if (state === "enabled") localStorage.setItem(ALERTS_ENABLED_KEY, "true")
        else localStorage.removeItem(ALERTS_ENABLED_KEY)
      }
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "No se pudieron cambiar las notificaciones push.")
      if (isRetryablePushError(err)) setRetryAction("device")
    } finally {
      setDevicePushBusy(false)
    }
  }

  async function toggleSound() {
    if (soundEnabled) {
      localStorage.removeItem(ALERT_SOUND_ENABLED_KEY)
      setSoundEnabled(false)
      return
    }

    // El navegador solo deja reproducir audio tras un gesto del
    // usuario, así que se desbloquea aquí mismo con una reproducción
    // silenciada de ida y vuelta.
    try {
      const audio = new Audio(ALERT_SOUND_URL)

      await audio.play()

      audio.pause()
      audio.currentTime = 0

      localStorage.setItem(ALERT_SOUND_ENABLED_KEY, "true")
      setSoundEnabled(true)
    } catch {
      setPushError(
        "El navegador bloqueó el sonido. En permisos del sitio cambia Sonido a Permitir."
      )
    }
  }

  function handleViewModeChange(mode: P2PViewMode) {
    setViewMode(mode)
    setStoredViewMode(mode)
  }

  function openCreate() {
    setEditingAlert(null)
    setSheetOpen(true)
  }

  function openEdit(alert: PriceAlert) {
    setEditingAlert(alert)
    setSheetOpen(true)
  }

  const isAndroidApp = notificationService.platform === "android"

  const devicePushDescription =
    devicePush === "denied"
      ? "Bloqueadas en los ajustes del dispositivo."
      : devicePush === "unsupported"
        ? isAndroidApp
          ? "Este dispositivo no puede conectarse con Google Play Services, necesarios para recibir notificaciones push."
          : "Este navegador no admite notificaciones push."
        : sharedWebPush
          ? "En el navegador usa la misma suscripción que las alertas bancarias."
          : "Recibe tus alertas de precio en este dispositivo."

  const previewAlerts = alerts.slice(0, ALERTS_PREVIEW_LIMIT)

  return (
    <>
      <AppShell>
        <AppHeader variant="tab" icon={Menu} title="Más" subtitle="Ajustes y preferencias" />

        <Section title="Notificaciones">
          <Row
            media={<VcIcon name="alert-bank" className="h-[18px] w-[18px]" />}
            title="Alertas bancarias"
            description="Avisos de intervención digital del Banco de Venezuela y Bancamiga."
            right={
              <Toggle
                checked={pushEnabled}
                onChange={togglePush}
                busy={pushBusy}
                label="Activar alertas bancarias"
              />
            }
          />

          <Row
            icon={Volume2}
            accent="#3AA8FF"
            title="Sonido de alerta"
            description="Reproduce un aviso sonoro cuando llega una alerta."
            right={
              <Toggle
                checked={soundEnabled}
                onChange={toggleSound}
                label="Activar sonido de alerta"
              />
            }
          />

          <Row
            icon={Smartphone}
            accent="#20D6A0"
            title="Push notifications"
            description={devicePushDescription}
            right={
              devicePush === "enabled" || devicePush === "disabled" ? (
                <Toggle
                  checked={devicePush === "enabled"}
                  onChange={toggleDevicePush}
                  busy={devicePushBusy}
                  label="Activar notificaciones push"
                />
              ) : undefined
            }
          />
        </Section>

        {pushError && (
          <div className="mt-2 px-1">
            <p className="text-[12px] leading-relaxed text-down">{pushError}</p>
            {retryAction && (
              <button
                type="button"
                onClick={retryAction === "bank" ? togglePush : toggleDevicePush}
                disabled={pushBusy || devicePushBusy}
                className="mt-2 inline-flex min-h-10 items-center rounded-ctl border border-hairbright bg-surface-raised px-4 text-[13px] font-semibold text-ink outline-none transition hover:bg-surface-soft focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50"
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        <Section
          title="Alertas de precio"
          action={
            alerts.length > 0 ? (
              <button
                type="button"
                onClick={() => navigate("/mas/alertas")}
                className="-my-2 flex min-h-11 items-center gap-0.5 rounded-lg px-1 text-[12px] font-semibold text-brand-light outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                Ver todas
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : undefined
          }
        >
          <button
            type="button"
            onClick={openCreate}
            className="flex min-h-11 w-full items-center gap-3 border-b border-hair bg-brand/15 px-4 py-3.5 text-left outline-none transition duration-200 last:border-b-0 hover:bg-brand/20 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.99]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <Plus className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-ink">Crear alerta</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-ink-muted">
                Recibe una notificación cuando el precio llegue a tu objetivo.
              </span>
            </span>
          </button>

          {previewAlerts.map((alert) => (
            <PriceAlertRow key={alert.id} alert={alert} onOpen={openEdit} />
          ))}

          {loading && alerts.length === 0 && (
            <p className="px-4 py-3 text-[12px] text-ink-faint">Cargando alertas…</p>
          )}

          {alertsError && (
            <p className="px-4 py-3 text-[12px] text-down">{alertsError}</p>
          )}
        </Section>

        <div className="mt-2 flex items-start gap-3 rounded-tile border border-hair bg-surface px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
          <p className="text-[12px] leading-relaxed text-ink-muted">
            Estas alertas usan los mismos precios que el análisis del mercado. El aviso llega cuando el precio
            cruza tu objetivo, tan rápido como se actualiza cada fuente.
          </p>
        </div>

        <Section title="Mercado">
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-light"
              >
                <VcIcon name="market-analysis" className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-ink">
                  Vista del mercado USDT
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-ink-muted">
                  La Profesional añade velas, temporalidades y medias móviles.
                </p>
              </div>
            </div>

            <div className="mt-3">
              <SegmentedControl
                options={VIEW_OPTIONS}
                value={viewMode}
                onChange={handleViewModeChange}
                label="Vista del mercado"
                size="sm"
              />
            </div>
          </div>
        </Section>

        <Section title="Proyecto">
          <Row
            icon={Heart}
            accent="#FF5D69"
            title="Apoyar VeneCambio"
            description="El proyecto se mantiene por cuenta propia."
            onClick={() => setDonationsOpen(true)}
          />

          <Row
            icon={Info}
            accent="#8B98A8"
            title="Sobre los datos"
            description="BCV del Banco Central de Venezuela y USDT del mercado P2P de Binance. El USDT se captura cada 5 minutos; el BCV y el Promedio, cada 30 minutos en horario laboral y al cierre del día."
          />
        </Section>

        <p className="mt-5 px-1 text-center text-[11px] text-ink-faint">
          VeneCambio · Tasa libre de Venezuela
        </p>
      </AppShell>

      <PriceAlertSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        alert={editingAlert}
        currentPrices={currentPrices}
        onSaved={reload}
      />

      <DonationsModal
        isOpen={donationsOpen}
        onClose={() => setDonationsOpen(false)}
      />
    </>
  )
}
