import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"

import AiHistorySheet from "./AiHistorySheet"
import P2PAiDrawer from "./P2PAiDrawer"
import type { P2PAiAnalysisController } from "./useP2PAiAnalysis"
import AiRewardSheet from "../shared/AiRewardSheet"

/**
 * Drawer de análisis IA + historial, compartidos por la vista Simple y
 * la Profesional.
 *
 * También atiende el enlace desde Inicio (?ia=<id> | ?ia=nuevo):
 * - ia=<id> abre ese análisis guardado (GET de lectura, sin modelo).
 * - ia=nuevo abre el drawer en espera; el usuario decide si analiza.
 * El parámetro se consume una vez y se quita de la URL.
 */
export default function MarketAiSheets({ ai }: { ai: P2PAiAnalysisController }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const intent = searchParams.get("ia")
  const { openDrawer, openHistory } = ai

  useEffect(() => {
    if (!intent) return

    const id = Number(intent)

    if (Number.isInteger(id) && id > 0) openHistory(id)
    else openDrawer()

    const next = new URLSearchParams(searchParams)
    next.delete("ia")
    setSearchParams(next, { replace: true })
  }, [intent, openDrawer, openHistory, searchParams, setSearchParams])

  return (
    <>
      <P2PAiDrawer {...ai.drawerProps} />
      <AiHistorySheet {...ai.historyProps} />
      <AiRewardSheet {...ai.rewardFlow} />
    </>
  )
}
