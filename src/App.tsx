import { Suspense, lazy, useEffect } from "react"
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom"

import ConvertPage from "./pages/convert"
import NotificationRouteBridge from "./components/shell/NotificationRouteBridge"
import OfflineNotice from "./components/shell/OfflineNotice"

/*
 * Carga por pantallas.
 *
 * Convertir es la pantalla de inicio y va en el bundle principal: es lo
 * primero que se ve y debe pintarse sin esperar a nada más. El resto
 * (Mercado con sus dos librerías de gráficos, Historial, Más) se separa
 * en archivos propios, así el arranque procesa mucho menos JavaScript.
 *
 * Para que navegar siga siendo inmediato, esas pantallas se precargan
 * en segundo plano cuando el teléfono está libre tras el primer pintado.
 */
const loadPriceChart = () => import("./pages/priceChart")
const loadUsdtAnalyzer = () => import("./pages/usdtAnalyzer")
const loadMore = () => import("./pages/more")
const loadPriceAlerts = () => import("./pages/priceAlerts")

const PriceChartPage = lazy(loadPriceChart)
const UsdtAnalyzerPage = lazy(loadUsdtAnalyzer)
const MorePage = lazy(loadMore)
const PriceAlertsPage = lazy(loadPriceAlerts)

/** Mismo fondo que la app: si una pantalla tarda un instante, no hay destello. */
function ScreenFallback() {
  return <div className="min-h-dvh bg-bg" aria-busy="true" />
}

function usePrefetchScreens() {
  useEffect(() => {
    const prefetch = () => {
      // Orden por probabilidad de uso.
      for (const load of [loadUsdtAnalyzer, loadPriceChart, loadMore, loadPriceAlerts]) {
        load().catch(() => {})
      }
    }

    // requestIdleCallback no existe en todos los WebView antiguos.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(prefetch, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }

    const timer = setTimeout(prefetch, 1500)
    return () => clearTimeout(timer)
  }, [])
}

/** /convertir era la ruta anterior: se conserva la tasa elegida (?tasa=). */
function LegacyConvertRedirect() {
  const { search } = useLocation()

  return <Navigate to={{ pathname: "/", search }} replace />
}

function App() {
  usePrefetchScreens()

  return (
    <BrowserRouter>
      <NotificationRouteBridge />
      <OfflineNotice />
      <Suspense fallback={<ScreenFallback />}>
        <Routes>
          {/* Convertir es la pantalla de inicio. */}
          <Route path="/" element={<ConvertPage />} />
          <Route path="/historial" element={<PriceChartPage />} />
          <Route path="/usdt-analisis" element={<UsdtAnalyzerPage />} />
          <Route path="/convertir" element={<LegacyConvertRedirect />} />
          <Route path="/mas" element={<MorePage />} />
          <Route path="/mas/alertas" element={<PriceAlertsPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
