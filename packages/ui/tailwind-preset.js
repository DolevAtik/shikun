/**
 * The Tailwind preset both apps share.
 *
 * Colors are CSS variables, never literals — swapping the token file swaps the
 * whole product, including a future migration to the official government
 * design system.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "var(--brand-navy)",
          DEFAULT: "var(--brand-blue)",
          hover: "var(--brand-blue-hover)",
          soft: "var(--brand-blue-soft)",
        },
        accent: {
          red: "var(--accent-red)",
          green: "var(--accent-green)",
          amber: "var(--accent-amber)",
          blue: "var(--accent-blue)",
          teal: "var(--accent-teal)",
          violet: "var(--accent-violet)",
        },
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
          tint: "var(--surface-tint)",
          sunken: "var(--surface-sunken)",
          brand: "var(--surface-brand)",
        },
        content: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          inverse: "var(--text-inverse)",
          onbrand: "var(--text-on-brand)",
          onsurfacebrand: "var(--on-surface-brand)",
        },
        line: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          soft: "var(--warning-soft)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        focus: "var(--focus-ring)",
      },
      fontFamily: {
        // Almoni is gov.il's typeface but it is commercially licensed. Until the
        // Ministry supplies a license this resolves to the free Hebrew stack,
        // and nothing in the design depends on Almoni's exact metrics.
        sans: ["var(--font-hebrew)", "Assistant", "Heebo", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        DEFAULT: "var(--ease)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up var(--duration) var(--ease) both",
      },
    },
  },
  plugins: [],
};
