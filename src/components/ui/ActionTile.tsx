import type { ReactNode } from "react"

/**
 * Acceso rápido compacto: chip de icono + etiqueta, sin caja propia.
 * Las cuatro acciones comparten una sola superficie (ver Inicio), así
 * no se leen como cuatro cards sueltas.
 *
 * El toque es CSS (escala .96 en 150 ms): no hace falta GSAP para esto.
 */
export default function ActionTile({
  icon,
  label,
  onClick,
  accent = "#9D72FF",
  primary = false,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  accent?: string
  /** Acción principal (Convertir): chip violeta sólido. */
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[72px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-tile px-1 py-2 outline-none transition duration-150 ease-out hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.96]"
    >
      <span
        aria-hidden
        className={`flex h-10 w-10 items-center justify-center rounded-[12px] border transition-colors duration-150 ${
          primary
            ? "border-brand/40 bg-brand text-white group-hover:border-brand-light"
            : "border-transparent group-hover:border-hairbright"
        }`}
        style={primary ? undefined : { backgroundColor: `${accent}1f`, color: accent }}
      >
        {icon}
      </span>
      <span className="max-w-full truncate text-[12px] font-semibold text-ink-soft group-hover:text-ink">
        {label}
      </span>
    </button>
  )
}
