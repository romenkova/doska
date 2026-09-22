import { DARK, LIGHT, type ThemeTokens } from "@doska/tokens"
import { useColorScheme } from "nativewind"

export interface Tokens extends ThemeTokens {
  dark: boolean
  /** The toolbar's tint over its blur, on the card sheet's `--card` surface. */
  cardVeil: string
}

const LIGHT_TOKENS: Tokens = {
  ...LIGHT,
  dark: false,
  cardVeil: "#ffffffcc",
}

const DARK_TOKENS: Tokens = {
  ...DARK,
  dark: true,
  cardVeil: "#2d3447cc",
}

export function useTokens(): Tokens {
  return useColorScheme().colorScheme === "dark" ? DARK_TOKENS : LIGHT_TOKENS
}
