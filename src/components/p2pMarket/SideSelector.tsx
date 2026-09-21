import type { P2PSideSelection } from "../../types/prices"
import SegmentedControl from "../priceHistory/SegmentedControl"

const OPTIONS: { key: P2PSideSelection; label: string }[] = [
  { key: "SELL", label: "SELL" },
  { key: "BUY", label: "BUY" },
  { key: "BOTH", label: "Ambos" },
]

type Props = {
  value: P2PSideSelection
  onChange: (value: P2PSideSelection) => void
  className?: string
}

/**
 * SELL = lo que recibe el usuario al vender USDT.
 * BUY  = lo que paga el usuario al comprar USDT.
 * Ambos = las dos series superpuestas (fuerza modo Línea en el chart:
 * dos juegos de velas a la vez es difícil de leer).
 */
export default function SideSelector({ value, onChange, className }: Props) {
  return (
    <div className={className ?? "w-[168px]"}>
      <SegmentedControl options={OPTIONS} value={value} onChange={onChange} label="Lado" size="sm" />
    </div>
  )
}
