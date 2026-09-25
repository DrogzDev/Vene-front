/**
 * Tema de la app (dark / light).
 *
 * - Preferencia: "system" (por defecto, sigue prefers-color-scheme),
 *   "dark" o "light". Se guarda en localStorage.
 * - El tema resuelto se aplica como data-theme en <html>; los colores
 *   salen de src/styles/tokens.css, así que ningún componente decide
 *   colores por su cuenta.
 * - index.html aplica el mismo cálculo antes del primer pintado (sin
 *   parpadeo); aquí se mantiene sincronizado mientras la app corre.
 */

export type ThemePreference = "system" | "dark" | "light"
export type ResolvedTheme = "dark" | "light"

// La misma clave la lee el script en línea de index.html.
const STORAGE_KEY = "vc-theme"
const DARK_QUERY = "(prefers-color-scheme: dark)"

// Color de la barra del navegador / estado, igual al fondo de cada tema.
const THEME_COLOR: Record<ResolvedTheme, string> = {
  dark: "#050607",
  light: "#F6F6F4",
}

const listeners = new Set<() => void>()

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "dark" || stored === "light" || stored === "system") return stored
  } catch {
    // Sin almacenamiento (modo privado, WebView restringido): sistema.
  }
  return "system"
}

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "dark"
  // Sin preferencia declarada, el tema principal es el oscuro.
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
}

let preference: ThemePreference = readPreference()

export function resolveTheme(value: ThemePreference = preference): ResolvedTheme {
  return value === "system" ? systemTheme() : value
}

function apply() {
  const resolved = resolveTheme()
  const root = document.documentElement

  root.dataset.theme = resolved
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[resolved])

  listeners.forEach((listener) => listener())
}

export function getThemePreference() {
  return preference
}

export function setThemePreference(next: ThemePreference) {
  preference = next

  try {
    if (next === "system") localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Se aplica igual; solo no se recuerda.
  }

  apply()
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Llamar una vez al arrancar: aplica el tema y sigue los cambios del sistema. */
export function initTheme() {
  apply()

  if (typeof window.matchMedia !== "function") return

  window.matchMedia(DARK_QUERY).addEventListener("change", () => {
    if (preference === "system") apply()
  })
}
