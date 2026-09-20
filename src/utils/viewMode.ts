import type { P2PViewMode } from "../types/prices"

const STORAGE_KEY = "vex_usdt_view_mode"

/**
 * Recuerda la última vista (Simple/Profesional) elegida en el
 * analizador USDT P2P, para que al volver se abra donde se dejó.
 */
export function getStoredViewMode(): P2PViewMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    return raw === "pro" ? "pro" : "simple"
  } catch {
    return "simple"
  }
}

export function setStoredViewMode(mode: P2PViewMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // localStorage puede fallar en navegación privada; no es crítico.
  }
}
