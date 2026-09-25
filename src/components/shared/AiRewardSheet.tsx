import { Gift, Loader2, PlayCircle } from "lucide-react"

import type { AiRewardFlowController } from "../../hooks/useAiRewardFlow"
import ResponsiveSheet from "./ResponsiveSheet"

/**
 * Sheet compartido para desbloquear un análisis IA adicional con un
 * Rewarded Ad de AdMob. Lo maneja useAiRewardFlow — este componente
 * solo pinta su estado, nunca decide nada por su cuenta.
 */
export default function AiRewardSheet({
  sheetOpen,
  sheetState,
  watchAd,
  retry,
  close,
}: AiRewardFlowController) {
  const busy = sheetState === "loading_ad" || sheetState === "awaiting_ssv"

  return (
    <ResponsiveSheet
      open={sheetOpen}
      onClose={close}
      ariaLabel="Desbloquear otro análisis"
      icon={<Gift className="h-4 w-4 shrink-0 text-gold" />}
      title="Desbloquea otro análisis"
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        {sheetState === "ad_required" && (
          <>
            <p className="text-sm text-ink-soft">
              Ya usaste tu análisis gratis de hoy. Mira un anuncio corto para desbloquear uno más.
            </p>

            <button
              type="button"
              onClick={watchAd}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-on-gold outline-none transition focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.97]"
            >
              <PlayCircle className="h-4 w-4" />
              Ver anuncio
            </button>
          </>
        )}

        {sheetState === "daily_limit_reached" && (
          <p className="text-sm text-ink-soft">
            Llegaste al máximo de análisis con anuncio por hoy. Vuelve mañana para más.
          </p>
        )}

        {sheetState === "loading_ad" && (
          <>
            <Loader2 className="h-6 w-6 text-gold motion-safe:animate-spin" />
            <p className="text-sm text-ink-soft">Preparando el anuncio...</p>
          </>
        )}

        {sheetState === "awaiting_ssv" && (
          <>
            <Loader2 className="h-6 w-6 text-gold motion-safe:animate-spin" />
            <p className="text-sm text-ink-soft">Verificando tu recompensa...</p>
          </>
        )}

        {sheetState === "unavailable" && (
          <>
            <p className="text-sm text-ink-soft">
              No se pudo mostrar el anuncio. Inténtalo de nuevo en un momento.
            </p>

            <button
              type="button"
              onClick={retry}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-surface-raised px-4 text-xs font-semibold text-ink-soft outline-none transition hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.97]"
            >
              Reintentar
            </button>
          </>
        )}

        {sheetState === "verification_timeout" && (
          <p className="text-sm text-ink-soft">
            La verificación está tardando más de lo normal. Cierra esta ventana e inténtalo de
            nuevo en unos segundos.
          </p>
        )}

        {busy && (
          <p className="text-[11px] text-ink-faint">Esto puede tardar unos segundos.</p>
        )}
      </div>
    </ResponsiveSheet>
  )
}
