import { useSyncExternalStore } from "react"
import { App } from "@capacitor/app"
import { Capacitor } from "@capacitor/core"
import { Network } from "@capacitor/network"

/*
 * Ciclo de vida de la app para mantener los datos frescos sin que el
 * usuario tenga que tocar "Actualizar":
 *
 * - onAppResume(): la app vuelve a primer plano (APK: appStateChange;
 *   web: la pestaña vuelve a ser visible) o recupera la conexión.
 * - useOnline(): estado de red real (APK: plugin Network; web: el mismo
 *   plugin usa navigator.onLine).
 *
 * Los que escuchan revalidan con la caché de pricesApi, que ya evita
 * repetir un pedido hecho hace segundos.
 */

type Listener = () => void

const resumeListeners = new Set<Listener>()
const networkListeners = new Set<Listener>()

let online = typeof navigator === "undefined" ? true : navigator.onLine
let started = false

function emitResume() {
  resumeListeners.forEach((listener) => listener())
}

function setOnline(next: boolean) {
  if (next === online) return

  const recovered = !online && next
  online = next
  networkListeners.forEach((listener) => listener())

  // Al recuperar la conexión se revalida como si la app volviera.
  if (recovered) emitResume()
}

/** Se llama una vez al arrancar (main.tsx). */
export function initAppLifecycle() {
  if (started) return
  started = true

  if (Capacitor.isNativePlatform()) {
    App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) emitResume()
    }).catch(() => {})
  } else {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") emitResume()
    })
  }

  Network.getStatus()
    .then((status) => setOnline(status.connected))
    .catch(() => {})

  Network.addListener("networkStatusChange", (status) => setOnline(status.connected)).catch(() => {})
}

/** Suscribirse a "la app volvió" o "volvió la conexión". Devuelve la limpieza. */
export function onAppResume(listener: Listener) {
  resumeListeners.add(listener)

  return () => {
    resumeListeners.delete(listener)
  }
}

function subscribeNetwork(listener: Listener) {
  networkListeners.add(listener)

  return () => {
    networkListeners.delete(listener)
  }
}

/** true si hay conexión. Se actualiza en vivo. */
export function useOnline() {
  return useSyncExternalStore(subscribeNetwork, () => online, () => true)
}
