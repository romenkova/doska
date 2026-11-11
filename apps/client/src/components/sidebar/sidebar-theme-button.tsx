import { SidebarMenuButton, SidebarMenuItem } from "@doska/ui-kit"
import { useTheme } from "@/providers/theme/theme-context"
import { THEME_ICON, themeLabel } from "@/lib/theme-display"

export function SidebarThemeButton() {
  const { theme, setTheme } = useTheme()
  const Icon = THEME_ICON[theme]

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Icon className="size-4" />
        <span>{themeLabel(theme)}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
