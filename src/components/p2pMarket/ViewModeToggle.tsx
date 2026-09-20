import type { P2PViewMode } from "../../types/prices"
import SegmentedControl from "../priceHistory/SegmentedControl"

const OPTIONS: { key: P2PViewMode; label: string }[] = [
  { key: "simple", label: "Simple" },
  { key: "pro", label: "Profesional" },
]

type Props = {
  value: P2PViewMode
  onChange: (value: P2PViewMode) => void
  className?: string
}

/** Reutiliza el mismo segmented control animado del historial de
 *  precios, así ambas pantallas comparten look & feel e interacción. */
export default function ViewModeToggle({ value, onChange, className }: Props) {
  return (
    <div className={className ?? "w-[220px]"}>
      <SegmentedControl
        options={OPTIONS}
        value={value}
        onChange={onChange}
        label="Vista"
        size="sm"
      />
    </div>
  )
}
