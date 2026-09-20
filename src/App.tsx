import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/home"
import PriceChartPage from "./pages/priceChart"
import UsdtAnalyzerPage from "./pages/usdtAnalyzer"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/historial" element={<PriceChartPage />} />
        <Route path="/usdt-analisis" element={<UsdtAnalyzerPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App