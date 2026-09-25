import { Capacitor } from "@capacitor/core"
import { AdMob, RewardAdPluginEvents } from "@capacitor-community/admob"

/**
 * Rewarded Ads de AdMob, solo en la APK (Capacitor nativo). El App ID
 * vive en la configuración nativa (strings.xml/AndroidManifest.xml) —
 * el SDK lo lee de ahí solo, nunca se le pasa desde JS.
 *
 * "client_rewarded", no "granted": el evento del SDK es del lado del
 * cliente nada más. El crédito de verdad lo otorga Django solo cuando
 * llega la verificación server-to-server (SSV) de Google — asíncrona,
 * ver src/services/aiEntitlement.ts.
 */
export type RewardedAdResult = "client_rewarded" | "dismissed" | "unavailable" | "error"

const isNative = Capacitor.isNativePlatform()

let initPromise: Promise<void> | null = null

function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = AdMob.initialize({
      // En build de desarrollo se piden siempre anuncios de prueba: sin
      // esto, probar contra el AD_UNIT_ID real generaría tráfico
      // inválido y AdMob puede suspender la cuenta.
      initializeForTesting: import.meta.env.DEV,
    })
  }

  return initPromise
}

/**
 * Prepara y muestra un Rewarded Ad para una RewardSession concreta.
 *
 * El `sessionId` va en `ssv.customData`: así el callback firmado que
 * Google manda a Django (server-to-server) dice a qué RewardSession
 * corresponde. Por eso el anuncio se prepara aquí mismo, por sesión, en
 * vez de precargarse de antemano — la SSV solo puede corresponder a la
 * sesión que estaba activa cuando se pidió el anuncio.
 */
export async function showRewardedAd(sessionId: string): Promise<RewardedAdResult> {
  if (!isNative) return "unavailable"

  const adUnitId = import.meta.env.VITE_ADMOB_REWARDED_AD_UNIT_ID as string | undefined

  if (!adUnitId) return "unavailable"

  try {
    await ensureInitialized()
    await AdMob.prepareRewardVideoAd({
      adId: adUnitId,
      isTesting: import.meta.env.DEV,
      ssv: { customData: sessionId },
    })
  } catch {
    return "unavailable"
  }

  return new Promise<RewardedAdResult>((resolve) => {
    let settled = false

    const handles: { remove: () => Promise<void> }[] = []

    const settle = (result: RewardedAdResult) => {
      if (settled) return
      settled = true

      for (const handle of handles) handle.remove()

      resolve(result)
    }

    // showRewardVideoAd() solo resuelve cuando el usuario SÍ gana la
    // recompensa; si cierra el anuncio antes, la promesa nunca resuelve
    // por su cuenta — por eso "Dismissed" se escucha aparte para
    // distinguir "cerrado sin ver el anuncio completo".
    Promise.all([
      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => settle("dismissed")),
      AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => settle("error")),
    ]).then(([dismissedHandle, failedHandle]) => {
      if (settled) {
        dismissedHandle.remove()
        failedHandle.remove()
        return
      }

      handles.push(dismissedHandle, failedHandle)
    })

    AdMob.showRewardVideoAd()
      .then(() => settle("client_rewarded"))
      .catch(() => settle("error"))
  })
}
