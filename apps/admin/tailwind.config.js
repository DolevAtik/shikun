/**
 * The admin extends the shared preset rather than redefining it: the same
 * tokens, the same dark-mode strategy, the same font stack as the employee app.
 *
 * The `colors` block below adds shadcn/ui's semantic names. Every one of them
 * points at a CSS variable that `src/app/shadcn-bridge.css` aliases onto a moch
 * token — so a vendored shadcn component styled `bg-background text-foreground`
 * is, in the end, painted with the Ministry's palette, and swapping the token
 * file still swaps the whole product.
 */
const preset = require("@moch/ui/tailwind-preset");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        input: "var(--input)",
        ring: "var(--ring)",
        sidebar: { DEFAULT: "var(--sidebar)", foreground: "var(--sidebar-foreground)" },
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
      },
    },
  },
};
