import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,

  include: ["./src/**/*.{js,jsx,ts,tsx}"],

  exclude: [],

  theme: {
    extend: {
      tokens: {
        colors: {
          bg: { value: "#0a0a0f" },
          bgCard: { value: "#12121a" },
          bgCardHover: { value: "#1a1a26" },
          neonGreen: { value: "#00ff88" },
          neonPurple: { value: "#7c3aed" },
          neonOrange: { value: "#ff6b35" },
          textPrimary: { value: "#e0e0e0" },
          textSecondary: { value: "#888899" },
          border: { value: "#2a2a3a" },
        },
        fonts: {
          mono: { value: "'SF Mono', 'Fira Code', 'JetBrains Mono', Menlo, Consolas, monospace" },
        },
      },
    },
  },

  outdir: "styled-system",
});
