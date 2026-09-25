/** @type {import('tailwindcss').Config} */

/**
 * Tokens de diseño de VeneCambio.
 *
 * Los valores NO viven aquí: cada color apunta a una variable CSS de
 * src/styles/tokens.css, que define los temas dark y light. Así una sola
 * clase (`bg-surface`, `text-ink`) sirve para los dos temas y cambiar de
 * tema no requiere tocar ningún componente.
 *
 * Los nombres históricos (bg, surface, hair, ink, up/down…) se conservan
 * para no reescribir las pantallas; ahora apuntan a la paleta nueva:
 * base monocroma (negro/gris/blanco) y la marca como acento.
 *
 * OJO: lightweight-charts recibe colores como strings, no clases. Esos
 * valores siguen en src/components/priceHistory/theme.ts (COLORS/PRICE).
 */

/** Color de tokens.css con soporte de opacidad (`bg-gold/15`). */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fondo negro carbón (dark) / blanco cálido (light).
        bg: {
          DEFAULT: token("bg-primary"),
          soft: token("bg-secondary"),
        },
        // Superficies apiladas: fondo → surface → raised → soft.
        surface: {
          DEFAULT: token("surface-1"),
          raised: token("surface-2"),
          soft: token("surface-3"),
        },
        // Fondo de las acciones rápidas de Inicio.
        tile: token("tile"),
        // Bordes finos: separan sin dibujar cajas.
        hair: token("border-subtle"),
        hairbright: token("border-default"),

        // Marca: SOLO como acento con función.
        gold: {
          DEFAULT: token("gold"),
          soft: token("gold-soft"),
          light: token("gold-light"),
          ink: token("gold-ink"),
        },
        "on-gold": token("on-gold"),
        teal: {
          DEFAULT: token("teal"),
          dark: token("teal-dark"),
        },

        // TRANSICIÓN: `brand` era el violeta de la UI anterior. Inicio ya
        // no lo usa; el resto de pantallas lo irá retirando. Mientras
        // tanto apunta al dorado, nunca más al violeta.
        brand: {
          DEFAULT: token("gold"),
          bright: token("gold"),
          light: token("gold-ink"),
        },

        // CTA neutro: blanco/negro según el tema.
        inverse: {
          DEFAULT: token("inverse"),
          fg: token("inverse-fg"),
        },
        nav: "var(--nav-bg)",

        // Semánticos financieros: éxito / error (estados, no precios).
        up: token("positive"),
        down: token("negative"),

        // Dirección del MOVIMIENTO del mercado, con la convención
        // financiera estándar: sube → verde, baja → rojo (también velas).
        // El impacto sobre el bolívar se muestra aparte, con su propio
        // indicador (ver BolivarStatus en el análisis IA).
        rise: token("positive"),
        fall: token("negative"),
        positive: token("positive"),
        negative: token("negative"),
        info: token("info"),
        warn: token("warning"),
        accent: token("teal"),

        // Semántica por activo: teal para USDT, azul para BCV.
        usdt: token("teal"),
        bcv: token("info"),

        // Texto en cuatro niveles de jerarquía.
        ink: {
          DEFAULT: token("text-primary"),
          soft: token("text-soft"),
          muted: token("text-secondary"),
          faint: token("text-muted"),
        },
      },

      borderRadius: {
        card: "22px",
        tile: "16px",
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

      boxShadow: {
        card: "var(--shadow-card)",
        nav: "var(--shadow-nav)",
        cta: "var(--shadow-cta)",

        // Sin halo de color alrededor de la marca (se leía como glow). Se
        // conserva el token para no tocar las clases `shadow-brand`.
        brand: "none",
      },
    },
  },
  plugins: [],
}
