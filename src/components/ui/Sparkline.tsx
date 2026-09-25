import { useId } from "react"

type Props = {
  /** Valores reales, del más antiguo al más reciente. */
  values: number[]
  color: string
  width?: number
  height?: number
  /** Relleno degradado bajo la línea (héroes); las filas van sin él. */
  fill?: boolean
  /** Ocupa el ancho del contenedor (el SVG se estira en horizontal). */
  fluid?: boolean
  strokeWidth?: number
}

/** Puntos mínimos para que la línea signifique algo. */
const MIN_POINTS = 3

/**
 * Línea de tendencia diminuta, dibujada con cierres reales.
 *
 * Si no hay al menos tres valores no dibuja nada y devuelve null: es
 * preferible un hueco a una línea inventada, que en una app de precios
 * se lee como información.
 */
export default function Sparkline({
  values,
  color,
  width = 56,
  height = 20,
  fill = false,
  fluid = false,
  strokeWidth = 1.75,
}: Props) {
  const gradientId = useId()
  const clean = values.filter((value) => Number.isFinite(value) && value > 0)

  if (clean.length < MIN_POINTS) return null

  const min = Math.min(...clean)
  const max = Math.max(...clean)
  const span = max - min

  const coords = clean.map((value, index) => {
    const x = (index / (clean.length - 1)) * width
    // Serie plana: línea recta centrada, sin dividir por cero.
    const y = span === 0 ? height / 2 : height - ((value - min) / span) * height

    // 1px de aire arriba y abajo para que no se corte el trazo.
    return [x, Math.min(height - 1, Math.max(1, y))] as const
  })

  const points = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `M0,${height} L${points.replace(/ /g, " L")} L${width},${height} Z`

  return (
    <svg
      width={fluid ? "100%" : width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={fluid ? "none" : undefined}
      fill="none"
      aria-hidden
      focusable="false"
      className="block shrink-0"
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              {/* El color va por style: así acepta variables CSS del tema,
                  que los atributos de presentación de SVG no resuelven. */}
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path data-spark-area d={area} fill={`url(#${gradientId})`} />
        </>
      )}
      <polyline
        points={points}
        style={{ stroke: color }}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
