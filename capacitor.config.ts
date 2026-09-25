import type { CapacitorConfig } from "@capacitor/cli"

/**
 * Empaquetado de VeneCambio como aplicación Android.
 *
 * La app carga el build de Vite desde el propio APK, así que no
 * depende de Vercel para arrancar: solo necesita internet para hablar
 * con la API.
 *
 * Detalle importante: con androidScheme "https" el WebView sirve la
 * app desde https://localhost, y ese es el Origin que Django ve en
 * cada petición. Sin añadirlo a CORS_ALLOWED_ORIGINS, todas las
 * llamadas fallan en el preflight sin un error claro en pantalla.
 */
const config: CapacitorConfig = {
  appId: "lat.venecambio.app",
  appName: "VeneCambio",
  webDir: "dist",

  android: {
    // Obligatorio para que el Service Worker y las APIs que exigen
    // contexto seguro funcionen dentro del WebView.
    androidScheme: "https",
  },

  server: {
    // El WebView solo debe cargar lo que viene dentro del APK. La API
    // se consume por fetch, no navegando a ella.
    androidScheme: "https",
  },

  plugins: {
    // El splash no se oculta solo: main.tsx lo quita cuando React ya
    // pintó el primer fotograma, para no mostrar un WebView vacío.
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#050607",
      // Recurso con el logo oficial (res/drawable/splash_brand.xml), no la
      // imagen de muestra de Capacitor.
      androidSplashResourceName: "splash_brand",
      showSpinner: false,
    },
    PushNotifications: {
      // Con la app abierta, la alerta de precio también se muestra
      // como notificación del sistema.
      presentationOptions: ["sound", "alert"],
    },
  },
}

export default config
