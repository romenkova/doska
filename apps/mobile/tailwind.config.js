const RADIUS = 10

const fontFamily = {
  sans: ["Mulish_400Regular"],
  "sans-medium": ["Mulish_500Medium"],
  "sans-semibold": ["Mulish_600SemiBold"],
  "sans-bold": ["Mulish_700Bold"],
  mono: ["GeistMono_400Regular"],
  "mono-medium": ["GeistMono_500Medium"],
}

const sharedColors = require("@doska/tokens/tailwind-colors.cjs")

const color = (name) => `var(--${name})`

/** @type {import('tailwindcss').Config} */
module.exports = {
  // The kit ships as source, so its classes are only generated if scanned here.
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui-kit-mobile/src/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily,
      colors: {
        ...sharedColors,
        mark: color("mark"),
        "quote-bar": color("quote-bar"),
        "card-ring": color("card-ring"),
        "button-muted": color("button-muted"),
      },
      borderRadius: {
        sm: RADIUS * 0.6,
        md: RADIUS * 0.8,
        lg: RADIUS,
        xl: RADIUS * 1.4,
        "2xl": RADIUS * 1.8,
        "3xl": RADIUS * 2.2,
        "4xl": RADIUS * 2.6,
      },
    },
  },
  plugins: [],
}
