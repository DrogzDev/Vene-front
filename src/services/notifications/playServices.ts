import { Capacitor, registerPlugin } from "@capacitor/core"

/**
 * Diagnóstico nativo para el push (plugin local PlayServicesPlugin.java).
 *
 * Es una señal ADICIONAL para entender un fallo de FCM, no su
 * explicación absoluta: con Play Services en "SUCCESS" el registro aún
 * puede fallar por red, VPN o un bloqueo de los servicios de Google.
 */
export type PlayServicesStatus = {
  available: boolean
  code: number
  /** SUCCESS, SERVICE_MISSING, SERVICE_VERSION_UPDATE_REQUIRED, SERVICE_DISABLED… */
  codeName: string
  gmsVersion: string | null
  online: boolean
  /** Android comprobó que la red activa llega de verdad a internet. */
  internetValidated: boolean
}

type PlayServicesPlugin = {
  check(): Promise<PlayServicesStatus>
}

const PlayServices = registerPlugin<PlayServicesPlugin>("PlayServices")

/** null fuera de la app nativa o si el plugin no respondió. */
export async function checkPlayServices(): Promise<PlayServicesStatus | null> {
  if (!Capacitor.isNativePlatform()) return null

  try {
    return await PlayServices.check()
  } catch {
    return null
  }
}
