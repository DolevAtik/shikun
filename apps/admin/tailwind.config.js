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

      /**
       * Portal enter/exit animations — fade and zoom, and deliberately nothing
       * else. tailwindcss-animate is not installed on purpose: its slide
       * utilities are physical (`slide-in-from-left`), and its logical variants
       * are known-buggy. A fade has no direction, so there is nothing to mirror
       * in Hebrew and nothing for a reviewer to get wrong. If a dropdown ever
       * needs to fly in from a side, that is a conversation, not a utility.
       */
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out": { from: { opacity: "1" }, to: { opacity: "0" } },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pop-out": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.97)" },
        },
      },
      animation: {
        "fade-in": "fade-in var(--duration-fast) var(--ease)",
        "fade-out": "fade-out var(--duration-fast) var(--ease)",
        "pop-in": "pop-in var(--duration-fast) var(--ease)",
        "pop-out": "pop-out var(--duration-fast) var(--ease)",
      },
    },
  },
};
