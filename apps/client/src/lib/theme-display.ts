import { Moon, Sun } from "lucide-react"

export const THEME_ICON = { light: Sun, dark: Moon }
const THEME_LABEL = { light: "Light", dark: "Dark" }

// Names the theme it is showing, not the one it switches to.
export function themeLabel(theme: "light" | "dark") {
  return `${THEME_LABEL[theme]} theme`
}
