import { Button } from "@doska/ui-kit"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      tooltip={false}
      aria-label="Toggle color theme"
      data-theme-toggle
    >
      <Moon className="size-5 dark:hidden" />
      <Sun className="hidden size-5 dark:block" />
    </Button>
  )
}
