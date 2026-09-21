/**
 * Iconos SVG del historial de precios.
 *
 * El proyecto no tiene librería de iconos: los SVG se escriben aquí a
 * mano para no añadir una dependencia entera por seis trazos.
 */

type IconProps = {
  className?: string
}

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
}

export function ChevronLeftIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function ChevronRightIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export function HistoryIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 12a9 9 0 1 0 2.64-6.36" />
      <path d="M3 4v5h5" />
      <path d="M12 8v4l3 2" />
    </svg>
  )
}

export function ClockIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function BankIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 10l9-5 9 5" />
      <path d="M5 10v8M10 10v8M14 10v8M19 10v8" />
      <path d="M3 21h18" />
    </svg>
  )
}

export function LineChartIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 17l5-6 4 3 5-7 4 4" />
    </svg>
  )
}

export function CandleChartIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 4v3M7 17v3M17 3v4M17 15v6" />
      <rect x="4.5" y="7" width="5" height="10" rx="1" />
      <rect x="14.5" y="7" width="5" height="8" rx="1" />
    </svg>
  )
}

export function ResetZoomIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 12a9 9 0 1 0 2.6-6.4" />
      <path d="M3 4v5h5" />
    </svg>
  )
}

export function SparkleIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path d="M12 2.5l1.7 5.1a3 3 0 0 0 1.9 1.9l5.1 1.7-5.1 1.7a3 3 0 0 0-1.9 1.9L12 20l-1.7-5.2a3 3 0 0 0-1.9-1.9L3.3 11.2l5.1-1.7a3 3 0 0 0 1.9-1.9z" />
      <path d="M19 3l.6 1.7 1.7.6-1.7.6L19 7.6l-.6-1.7-1.7-.6 1.7-.6z" opacity="0.7" />
    </svg>
  )
}

export function CloseIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export function RefreshIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 4v5h-5" />
    </svg>
  )
}

export function ArrowUpIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}

export function ArrowDownIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14M18 13l-6 6-6-6" />
    </svg>
  )
}

export function MinusIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h14" />
    </svg>
  )
}

export function AlertIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4.5M12 16h.01" />
    </svg>
  )
}
