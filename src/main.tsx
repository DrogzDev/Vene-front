import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'

// La fuente viaja dentro del bundle, no se pide a Google Fonts. Dentro
// del APK eso importa: con un CDN la app arrancaría con Arial hasta que
// hubiera red, y sin conexión se quedaría así.
import '@fontsource-variable/inter'

import './index.css'
import App from './App.tsx'
import { initAppLifecycle } from './services/appLifecycle'

initAppLifecycle()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// En la APK el splash nativo se mantiene hasta que React pintó el primer
// fotograma (Inicio sale de la caché si ya hubo una visita), así no se ve
// la pantalla vacía mientras arranca el WebView. Dos frames: el primero
// agenda el pintado, el segundo confirma que ya está en pantalla.
if (Capacitor.isNativePlatform()) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {})
    }),
  )
}
