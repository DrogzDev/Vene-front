export function formatBs(value: number) {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString))
}

/**
 * Formato para el eje de precio del gráfico.
 *
 * Mantiene siempre dos decimales y separador de miles, para que el eje
 * muestre "898,78" y nunca una notación recortada que no representa el
 * precio real.
 */
export function formatPriceAxis(value: number) {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Variación firmada en bolívares: "-2,00 Bs", "+1,35 Bs".
 */
export function formatBsChange(value: number) {
  const sign = value >= 0 ? "+" : "−"

  return `${sign}${formatBs(Math.abs(value))} Bs`
}

/**
 * "hace 3 min", "hace 2 h", "ayer"...
 *
 * Usa Intl.RelativeTimeFormat para no arrastrar otra dependencia.
 */
export function formatRelativeFromNow(dateString: string) {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) return ""

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const absSeconds = Math.abs(diffSeconds)

  const formatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" })

  if (absSeconds < 60) return "hace un momento"
  if (absSeconds < 3600) return formatter.format(Math.round(diffSeconds / 60), "minute")
  if (absSeconds < 86400) return formatter.format(Math.round(diffSeconds / 3600), "hour")

  return formatter.format(Math.round(diffSeconds / 86400), "day")
}
