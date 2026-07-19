import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic tokens mapped to CSS variables (see globals.css)
        bg: "var(--bg)", surface: "var(--surface)", "surface-2": "var(--surface-2)",
        ink: "var(--ink)", muted: "var(--muted)", faint: "var(--faint)",
        border: "var(--border)", "border-strong": "var(--border-strong)",
        primary: "var(--primary)", "primary-ink": "var(--primary-ink)",
        "primary-soft": "var(--primary-soft)", "primary-tint": "var(--primary-tint)",
        accent: "var(--accent)",
      },
      borderRadius: { xl2: "20px" },
      fontFamily: { sans: ["var(--font-tajawal)", "Tajawal", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
