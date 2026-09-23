import type { P2PViewMode } from "../../types/prices"
import SegmentedControl from "../priceHistory/SegmentedControl"

const OPTIONS: { key: P2PViewMode; label: string }[] = [
  { key: "simple", label: "Simple" },
  { key: "pro", label: "Profesional" },
]

// Versión corta para la cabecera, donde el control ocupa ~140 px.
const COMPACT_OPTIONS: { key: P2PViewMode; label: string }[] = [
  { key: "simple", label: "Simple" },
  { key: "pro", label: "Pro" },
]

type Props = {
  value: P2PViewMode
  onChange: (value: P2PViewMode) => void
  className?: string
  /** Etiquetas cortas ("Pro") para colocarlo en la cabecera. */
  compact?: boolean
}

/** Reutiliza el mismo segmented control animado del historial de
 *  precios, así ambas pantallas comparten look & feel e interacción. */
export default function ViewModeToggle({ value, onChange, className, compact = false }: Props) {
  return (
    <div className={className ?? "w-[220px]"}>
      <SegmentedControl
        options={compact ? COMPACT_OPTIONS : OPTIONS}
        value={value}
        onChange={onChange}
        label="Vista"
        size="xs"
      />
    </div>
  )
}
