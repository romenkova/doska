import { useTheme } from "@/components/theme-provider"
import { Button } from "@doska/ui-kit"
import { Moon, Sun } from "lucide-react"

const THEME_ICON = { light: Sun, dark: Moon }
const THEME_LABEL = { light: "Light", dark: "Dark" }

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = THEME_ICON[theme]

  return (
    <Button
      variant="ghost"
      size="sm"
      className="justify-start gap-2"
      onClick={() => {
        setTheme(theme === "dark" ? "light" : "dark")
      }}
    >
      <Icon className="size-4" />
      <span>{THEME_LABEL[theme]} theme</span>
    </Button>
  )
}
