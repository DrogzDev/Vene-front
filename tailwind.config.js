/** @type {import('tailwindcss').Config} */

/**
 * Tokens de diseño de VeneCambio.
 *
 * Hasta ahora `theme.extend` estaba vacío y cada pantalla escribía sus
 * propios hex en clases arbitrarias (`bg-[#12151c]`), lo que dejó tres
 * paletas distintas conviviendo. A partir de aquí los colores tienen
 * nombre y una sola definición.
 *
 * OJO: las gráficas leen los colores desde JavaScript, no desde
 * Tailwind (lightweight-charts recibe COLORS.up / down / grid). Por eso
 * estos valores están duplicados a propósito en
 * src/components/priceHistory/theme.ts y los dos archivos tienen que
 * moverse juntos.
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fondo grafito casi negro.
        bg: {
          DEFAULT: "#06080C",
          soft: "#090C12",
        },
        // Superficies apiladas en azul grisáceo, no en cian: fondo muy
        // oscuro → surface → raised → soft. Cada nivel se distingue del
        // anterior; así no todas las cards tienen el mismo color.
        surface: {
          DEFAULT: "#0E131B",
          raised: "#141A24",
          soft: "#1A212C",
        },
        // Borde neutro muy tenue: separa sin dibujar cajas.
        hair: "rgba(255, 255, 255, 0.06)",
        hairbright: "rgba(255, 255, 255, 0.09)",

        // Violeta: color de interacción y de marca.
        brand: {
          DEFAULT: "#7C5CFF",
          bright: "#8D63FF",
          light: "#9D72FF",
        },

        // Semánticos financieros: éxito / error (estados, no precios).
        up: "#20D6A0",
        down: "#FF5D69",

        // Dirección del MOVIMIENTO del mercado, con la convención
        // financiera estándar: sube → verde, baja → rojo (también velas).
        // El impacto sobre el bolívar se muestra aparte, con su propio
        // indicador (ver BolivarStatus en el análisis IA).
        rise: "#20D6A0",
        fall: "#FF5D69",
        info: "#3AA8FF",
        warn: "#F0B429",
        // Acento secundario (cyan/teal), para detalles puntuales.
        accent: "#2DD4E6",

        // Semántica por activo: teal para USDT/mercado, azul para BCV
        // (información institucional). El violeta es la UI; el verde,
        // solo lo positivo.
        usdt: "#1FBF9F",
        bcv: "#3AA8FF",

        // Texto en tres niveles de jerarquía.
        ink: {
          DEFAULT: "#F5F7FA",
          soft: "#C3CBD6",
          muted: "#8E9AAA",
          faint: "#5E6B7B",
        },
      },

      borderRadius: {
        card: "18px",
        tile: "14px",
        ctl: "12px",
      },

      fontFamily: {
        sans: [
          "InterVariable",
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },

      // Altura reservada por la navegación inferior. AppShell la usa
      // para que la última tarjeta nunca quede debajo de la barra.
      spacing: {
        nav: "64px",
      },

      backgroundImage: {
        // Fondo del hero de Inicio: un velo violeta casi imperceptible que
        // nace y muere en transparente, sin bordes visibles. No es un glow.
        hero: "linear-gradient(180deg, rgba(124, 92, 255, 0) 0%, rgba(124, 92, 255, 0.07) 30%, rgba(124, 92, 255, 0.03) 70%, rgba(124, 92, 255, 0) 100%)",
      },

      boxShadow: {
        card: "0 8px 24px rgba(0, 0, 0, 0.28)",
        nav: "0 -6px 20px rgba(0, 0, 0, 0.35)",

        // Halo violeta DESACTIVADO a petición del usuario.
        //
        // Era "0 10px 28px rgba(124, 92, 255, 0.35)" y lo llevaban la
        // píldora activa, el indicador del segmented control, el
        // timeframe seleccionado, el botón central de la navegación y el
        // CTA de análisis. Alrededor del texto se leía como si las
        // letras brillasen.
        //
        // Se deja el token, en vez de borrar la clase de los ocho
        // archivos que la usan, para que reactivarlo sea cambiar esta
        // línea y nada más.
        brand: "none",
      },
    },
  },
  plugins: [],
}
