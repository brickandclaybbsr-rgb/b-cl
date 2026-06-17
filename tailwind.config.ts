import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0A0A0B", // near-pure black
          card: "#121214",
          elevated: "#1A1A1D",
          hover: "#202024",
        },
        // Accent is monochrome white — minimalist. Opacity modifiers
        // (e.g. bg-fire/10) give subtle white tints on black.
        fire: {
          DEFAULT: "#FFFFFF",
          50: "#FFFFFF",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#FFFFFF",
          500: "#FFFFFF",
          600: "#E5E5E5",
          700: "#D4D4D4",
        },
        warm: {
          DEFAULT: "#FFFFFF",
          light: "#D4D4D4",
        },
        content: {
          primary: "#FAFAFA",
          secondary: "#8B8B92",
        },
        border: {
          DEFAULT: "#242428",
          strong: "#34343A",
        },
        success: "#37D399",
        warning: "#F0B23E",
        danger: "#F26D6D",
      },
      fontFamily: {
        display: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
        mono: ["var(--font-poppins)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.5), 0 12px 32px -20px rgba(0,0,0,0.8)",
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 30px -24px rgba(0,0,0,0.9)",
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px -12px rgba(255,255,255,0.08)",
        fire: "0 10px 30px -10px rgba(255,255,255,0.18)",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.45s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.18s ease-out both",
        "scale-in": "scale-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
        "slide-down": "slide-down 0.3s ease-out both",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
