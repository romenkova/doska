import { useTheme } from "@/providers/theme/theme-context"
import { Button } from "@doska/ui-kit"
import { THEME_ICON, themeLabel } from "@/lib/theme-display"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = THEME_ICON[theme]

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={themeLabel(theme)}
      className="shrink-0 text-muted-foreground"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Icon className="size-4" />
    </Button>
  )
}
