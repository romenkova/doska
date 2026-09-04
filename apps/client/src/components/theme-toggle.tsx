import { useTheme } from "@/providers/theme/theme-context"
import { Button, cn } from "@doska/ui-kit"
import { Moon, Sun } from "lucide-react"

const THEME_ICON = { light: Sun, dark: Moon }
const THEME_LABEL = { light: "Light", dark: "Dark" }

interface IProps {
  /** Drops the label, for a bar with no room for it. */
  iconOnly?: boolean
}

export function ThemeToggle({ iconOnly }: IProps) {
  const { theme, setTheme } = useTheme()
  const Icon = THEME_ICON[theme]
  // Names the theme it is showing, not the one it switches to.
  const label = `${THEME_LABEL[theme]} theme`

  return (
    <Button
      variant="ghost"
      size={iconOnly ? "icon-sm" : "sm"}
      aria-label={iconOnly ? label : undefined}
      className={cn(
        "shrink-0",
        iconOnly ? "text-muted-foreground" : "justify-start gap-2 px-2"
      )}
      onClick={() => {
        setTheme(theme === "dark" ? "light" : "dark")
      }}
    >
      <Icon className="size-4" />
      {!iconOnly && <span>{label}</span>}
    </Button>
  )
}
