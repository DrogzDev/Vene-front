import { useSyncExternalStore } from "react"

import { getThemePreference, resolveTheme, setThemePreference, subscribeTheme } from "./theme"

/** Tema actual (preferencia y tema resuelto) y el setter para el selector. */
export function useTheme() {
  const preference = useSyncExternalStore(subscribeTheme, getThemePreference, getThemePreference)
  const resolved = useSyncExternalStore(subscribeTheme, () => resolveTheme(), () => "dark" as const)

  return { preference, resolved, setPreference: setThemePreference }
}
