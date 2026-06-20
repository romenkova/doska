import { useTheme } from "@/components/theme-provider"
import { Button } from "@deck/ui-kit"
import { MonitorCog, Moon, Sun } from "lucide-react"

const THEME_ORDER = ["light", "dark", "system"] as const
const THEME_ICON = { light: Sun, dark: Moon, system: MonitorCog }
const THEME_LABEL = { light: "Light", dark: "Dark", system: "System" }

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = THEME_ICON[theme]

  return (
    <Button
      variant="ghost"
      size="sm"
      className="justify-start gap-2"
      onClick={() => {
        const next =
          THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]
        setTheme(next)
      }}
    >
      <Icon className="size-4" />
      <span>{THEME_LABEL[theme]} theme</span>
    </Button>
  )
}
