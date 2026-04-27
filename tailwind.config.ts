import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Barlow Condensed", "sans-serif"],
        display: ["Antonio", "Barlow Condensed", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        wardrobe: {
          sand: "hsl(var(--wardrobe-sand))",
          clay: "hsl(var(--wardrobe-clay))",
          olive: "hsl(var(--wardrobe-olive))",
          warm: "hsl(var(--wardrobe-warm))",
        },
        // Legacy neon aliases — mapped to LCARS for backward compatibility
        neon: {
          cyan: "hsl(var(--lcars-cyan))",
          pink: "hsl(var(--lcars-red))",
          lime: "hsl(var(--lcars-yellow))",
        },
        // LCARS palette
        lcars: {
          orange: "hsl(var(--lcars-orange))",
          red: "hsl(var(--lcars-red))",
          peach: "hsl(var(--lcars-peach))",
          salmon: "hsl(var(--lcars-salmon))",
          lavender: "hsl(var(--lcars-lavender))",
          violet: "hsl(var(--lcars-violet))",
          blue: "hsl(var(--lcars-blue))",
          cyan: "hsl(var(--lcars-cyan))",
          yellow: "hsl(var(--lcars-yellow))",
          bronze: "hsl(var(--lcars-bronze))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        neon: "0 0 0 1px hsl(var(--lcars-orange) / 0.5)",
        "neon-pink": "0 0 0 1px hsl(var(--lcars-red) / 0.5)",
        "neon-lime": "0 0 0 1px hsl(var(--lcars-yellow) / 0.5)",
        glass: "0 0 0 1px hsl(var(--lcars-orange) / 0.4)",
        lcars: "0 0 0 1px hsl(var(--lcars-orange) / 0.5)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-highlight": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--lcars-peach) / 0.9)" },
          "70%": { boxShadow: "0 0 0 12px hsl(var(--lcars-peach) / 0)" },
          "100%": { boxShadow: "0 0 0 0 hsl(var(--lcars-peach) / 0)" },
        },
        "neon-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "lcars-tick": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
        "lcars-marquee": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "lcars-boot": {
          "0%": { transform: "scaleX(0)", opacity: "1" },
          "60%": { transform: "scaleX(1)", opacity: "1" },
          "100%": { transform: "scaleX(1)", opacity: "0" },
        },
        "lcars-pulse-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--lcars-cyan) / 0.6)" },
          "50%": { boxShadow: "0 0 0 6px hsl(var(--lcars-cyan) / 0)" },
        },
        "blob-float": {
          "0%, 100%": { transform: "translate(0, 0)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "neon-pulse": "neon-pulse 1.4s ease-in-out infinite",
        "lcars-tick": "lcars-tick 1.6s ease-in-out infinite",
        "lcars-marquee": "lcars-marquee 28s linear infinite",
        "lcars-boot": "lcars-boot 0.9s ease-out forwards",
        "lcars-pulse-ring": "lcars-pulse-ring 1.6s ease-out infinite",
        "blob-float": "blob-float 1s linear",
        "gradient-shift": "gradient-shift 1s linear",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
