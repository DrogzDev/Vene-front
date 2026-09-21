import type { P2PSideSelection } from "../types/prices"

const SIDE_KEY = "vex_p2p_side"
const NOTIONAL_KEY = "vex_p2p_notional"

const VALID_SIDES: P2PSideSelection[] = ["SELL", "BUY", "BOTH"]

export function getStoredP2PSide(): P2PSideSelection {
  try {
    const raw = localStorage.getItem(SIDE_KEY)

    return (VALID_SIDES as string[]).includes(raw ?? "")
      ? (raw as P2PSideSelection)
      : "SELL"
  } catch {
    return "SELL"
  }
}

export function setStoredP2PSide(side: P2PSideSelection) {
  try {
    localStorage.setItem(SIDE_KEY, side)
  } catch {
    // localStorage puede fallar en navegación privada; no es crítico.
  }
}

export function getStoredP2PNotional(defaultValue: number): number {
  try {
    const raw = localStorage.getItem(NOTIONAL_KEY)
    const parsed = raw ? Number(raw) : NaN

    return Number.isFinite(parsed) ? parsed : defaultValue
  } catch {
    return defaultValue
  }
}

export function setStoredP2PNotional(notional: number) {
  try {
    localStorage.setItem(NOTIONAL_KEY, String(notional))
  } catch {
    // localStorage puede fallar en navegación privada; no es crítico.
  }
}
