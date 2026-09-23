import { WifiOff } from "lucide-react"

import { useOnline } from "../../services/appLifecycle"

/**
 * Aviso discreto de "sin conexión", flotando sobre la navegación.
 *
 * Las pantallas siguen mostrando lo último guardado (cada dato con su
 * hora); este aviso solo explica por qué no se actualiza. Al volver la
 * red desaparece y las pantallas revalidan solas (onAppResume).
 */
export default function OfflineNotice() {
  const online = useOnline()

  if (online) return null

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: "calc(var(--nav-h) + var(--sab) + 2.25rem)" }}
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-hairbright bg-surface-raised px-3.5 py-2 text-[12px] font-semibold text-ink-soft shadow-card motion-safe:animate-fade-in-fast">
        <WifiOff className="h-3.5 w-3.5 text-warn" aria-hidden />
        Sin conexión · mostrando datos guardados
      </span>
    </div>
  )
}
