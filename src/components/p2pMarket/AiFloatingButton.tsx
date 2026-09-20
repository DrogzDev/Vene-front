import { SparkleIcon } from "../priceHistory/icons"

type Props = {
  onClick: () => void
}

/**
 * Botón flotante de IA para la Vista Profesional en móvil.
 *
 * Respeta env(safe-area-inset-bottom) para no quedar tapado por la
 * barra de gestos, y usa un z-index moderado (no tan alto como el de
 * ResponsiveSheet) para no competir nunca con un modal abierto.
 */
export default function AiFloatingButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Análisis del mercado"
      className="fixed right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full border border-[#a78bfa]/30 bg-[#171426]/95 px-4 text-sm font-semibold text-[#c4b5fd] shadow-[0_12px_30px_rgba(0,0,0,0.5)] outline-none backdrop-blur-sm transition duration-200 hover:border-[#a78bfa]/55 hover:bg-[#1d1830] focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50 active:scale-95 sm:hidden"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <SparkleIcon className="h-4 w-4" />
      IA
    </button>
  )
}
