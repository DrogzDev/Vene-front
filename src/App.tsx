import { Suspense, lazy, useEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "./pages/home"
import NotificationRouteBridge from "./components/shell/NotificationRouteBridge"
import OfflineNotice from "./components/shell/OfflineNotice"

/*
 * Carga por pantallas.
 *
 * Inicio va en el bundle principal: es lo primero que se ve y debe
 * pintarse sin esperar a nada más. El resto (Mercado con sus dos
 * librerías de gráficos, Historial, Convertir, Más) se separa en
 * archivos propios, así el arranque procesa mucho menos JavaScript.
 *
 * Para que navegar siga siendo inmediato, esas pantallas se precargan
 * en segundo plano cuando el teléfono está libre tras el primer pintado.
 */
const loadPriceChart = () => import("./pages/priceChart")
const loadUsdtAnalyzer = () => import("./pages/usdtAnalyzer")
const loadConvert = () => import("./pages/convert")
const loadMore = () => import("./pages/more")
const loadPriceAlerts = () => import("./pages/priceAlerts")

const PriceChartPage = lazy(loadPriceChart)
const UsdtAnalyzerPage = lazy(loadUsdtAnalyzer)
const ConvertPage = lazy(loadConvert)
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
      for (const load of [loadConvert, loadUsdtAnalyzer, loadPriceChart, loadMore, loadPriceAlerts]) {
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

function App() {
  usePrefetchScreens()

  return (
    <BrowserRouter>
      <NotificationRouteBridge />
      <OfflineNotice />
      <Suspense fallback={<ScreenFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/historial" element={<PriceChartPage />} />
          <Route path="/usdt-analisis" element={<UsdtAnalyzerPage />} />
          <Route path="/convertir" element={<ConvertPage />} />
          <Route path="/mas" element={<MorePage />} />
          <Route path="/mas/alertas" element={<PriceAlertsPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
