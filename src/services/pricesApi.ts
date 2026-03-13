import type { PricesHomeResponse } from "../types/prices"

const API_BASE = import.meta.env.VITE_API_URL

export async function getHomePrices() {
  const response = await fetch(`${API_BASE}/prices/home/`)

  if (!response.ok) {
    throw new Error("No se pudo obtener la información del home")
  }

  const data: PricesHomeResponse = await response.json()

  if (!data.ok) {
    throw new Error("La API respondió con error")
  }

  return data.data
}

export async function refreshHomePrices() {
  const response = await fetch(`${API_BASE}/prices/refresh/`, {
    method: "POST",
  })

  if (!response.ok) {
    throw new Error("No se pudieron actualizar los precios")
  }

  const data = await response.json()

  if (!data.ok) {
    throw new Error(data.error || "Error actualizando precios")
  }

  return data.data
}