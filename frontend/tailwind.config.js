/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primaryBlue: "#2563EB",
        primaryDark: "#1E293B",
        backgroundSoft: "#F8FAFC",
        cardWhite: "#FFFFFF",
        borderSoft: "#E2E8F0",
        textMain: "#0F172A",
        textGray: "#64748B",
        successGreen: "#22C55E",
        warningAmber: "#F59E0B",
        dangerRed: "#EF4444",
        // Dark mode colors mapped to CSS variables
        darkBg: "var(--color-bg)",
        darkCard: "var(--color-card)",
        darkBorder: "var(--color-border)",
        darkText: "var(--color-text)",
        darkTextGray: "var(--color-text-gray)",
        // Accent colors
        accentPurple: "#8B5CF6",
        accentCyan: "#06B6D4",
        accentIndigo: "#6366F1"
      },
      fontFamily: {
        sans: ["Inter", "Be Vietnam Pro", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.05)",
        cardHover: "0 8px 28px rgba(37, 99, 235, 0.12)",
        darkCard: "0 4px 20px rgba(0,0,0,0.3)",
        glow: "0 0 20px rgba(99, 102, 241, 0.15)"
      },
      borderRadius: {
        card: "20px"
      },
      backdropBlur: {
        glass: "12px"
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-right": "slideRight 0.3s ease-out",
        "pulse-slow": "pulse 3s infinite"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" }
        }
      }
    }
  },
  plugins: []
};
