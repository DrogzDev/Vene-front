import { TickMarkType } from "lightweight-charts"
import type { Time } from "lightweight-charts"

/**
 * Formateo de fechas del gráfico en hora de Venezuela.
 *
 * lightweight-charts pinta los ejes en UTC. En lugar de desplazar los
 * timestamps (lo que falsearía los datos) se formatean las etiquetas
 * con Intl en la zona horaria correcta.
 */

const VENEZUELA_TZ = "America/Caracas"

const hourFormatter = new Intl.DateTimeFormat("es-VE", {
  timeZone: VENEZUELA_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

const dayFormatter = new Intl.DateTimeFormat("es-VE", {
  timeZone: VENEZUELA_TZ,
  day: "2-digit",
  month: "short",
})

const fullFormatter = new Intl.DateTimeFormat("es-VE", {
  timeZone: VENEZUELA_TZ,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

function cleanMonth(text: string) {
  // Intl añade un punto en los meses abreviados ("20 sept.").
  return text.replace(".", "")
}

export function toDate(time: Time) {
  return new Date((time as number) * 1000)
}

/**
 * Etiquetas del eje de tiempo.
 *
 * lightweight-charts ya decide qué marcas caben y de qué tipo son, así
 * que basta con darle el formato adecuado a cada una para que no se
 * repitan horas ni se corten los textos.
 */
export function formatTickMark(time: Time, tickMarkType: TickMarkType) {
  const date = toDate(time)

  if (
    tickMarkType === TickMarkType.Year ||
    tickMarkType === TickMarkType.Month ||
    tickMarkType === TickMarkType.DayOfMonth
  ) {
    return cleanMonth(dayFormatter.format(date))
  }

  return hourFormatter.format(date)
}

/** Fecha completa para el crosshair y los tooltips. */
export function formatFullTime(time: Time) {
  return cleanMonth(fullFormatter.format(toDate(time)))
}

/** Fecha de la lectura activa, ajustada al intervalo de las velas. */
export function formatReadoutTime(time: number, interval: "hour" | "day") {
  const date = new Date(time * 1000)

  if (interval === "day") {
    return cleanMonth(dayFormatter.format(date))
  }

  return cleanMonth(fullFormatter.format(date))
}
