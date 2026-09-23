import { useCallback, useEffect, useState } from "react"

import { PRICE_ALERT_RECEIVED_EVENT } from "../../services/notifications"
import {
  getAlertCurrentPrices,
  listPriceAlerts,
  PriceAlertsError,
  type CurrentPricesResponse,
  type PriceAlert,
} from "../../services/priceAlerts"

/**
 * Alertas del dispositivo y precios actuales. Se recarga sola cuando
 * llega el aviso de una alerta con la app abierta.
 */
export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [currentPrices, setCurrentPrices] = useState<CurrentPricesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const reload = useCallback(async () => {
    // Independientes: si falla la lista, el formulario igual debe
    // mostrar el precio actual (y al revés).
    getAlertCurrentPrices()
      .then(setCurrentPrices)
      .catch(() => setCurrentPrices(null))

    try {
      setAlerts(await listPriceAlerts())
      setError("")
    } catch (err) {
      setError(err instanceof PriceAlertsError ? err.message : "No se pudieron cargar las alertas.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Carga inicial: reload() es asíncrona y solo toca estado al resolver.
    reload()

    const handler = () => {
      reload()
    }

    window.addEventListener(PRICE_ALERT_RECEIVED_EVENT, handler)
    return () => window.removeEventListener(PRICE_ALERT_RECEIVED_EVENT, handler)
  }, [reload])

  return { alerts, setAlerts, currentPrices, loading, error, reload }
}
