import { AlertIcon, CandleChartIcon } from "./icons"

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`rounded-tile bg-surface-soft motion-safe:animate-pulse-soft ${className}`}
    />
  )
}

/**
 * Esqueleto del Price Hero. Reproduce la silueta real del contenido
 * para que no haya salto al llegar los datos.
 */
export function PriceHeroSkeleton() {
  return (
    <div role="status" aria-label="Cargando precios">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>

      <Skeleton className="mt-2 h-3 w-40" />
      <Skeleton className="mt-3 h-[52px] w-full" />
    </div>
  )
}

export function ChartSkeleton({ height }: { height: number | string }) {
  return (
    <div
      role="status"
      aria-label="Cargando gráfica"
      className="flex w-full flex-col justify-end gap-3"
      style={{ height }}
    >
      <div className="flex flex-1 items-end gap-1.5 px-1">
        {/* Perfil irregular para que no parezca una barra de progreso. */}
        {[38, 52, 45, 63, 58, 72, 66, 81, 74, 88, 79, 94].map((value, index) => (
          <div key={index} className="flex-1" style={{ height: `${value}%` }}>
            <Skeleton className="h-full w-full rounded-t-md" />
          </div>
        ))}
      </div>

      <div className="flex justify-between px-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-2.5 w-10" />
        ))}
      </div>
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description: string
  icon?: "chart" | "alert"
  action?: React.ReactNode
  height?: number | string
}

export function EmptyState({
  title,
  description,
  icon = "chart",
  action,
  height,
}: EmptyStateProps) {
  const Icon = icon === "alert" ? AlertIcon : CandleChartIcon

  return (
    <div
      className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center"
      style={height ? { minHeight: height } : undefined}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] text-ink-faint">
        <Icon className="h-5 w-5" />
      </span>

      <p className="mt-1 text-[15px] font-bold text-ink-soft">{title}</p>
      <p className="max-w-[30ch] text-[12px] leading-relaxed text-ink-faint">{description}</p>

      {action}
    </div>
  )
}
