import { Button } from "@doska/ui-kit"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  // No React state: the icon tracks the `.dark` class via Tailwind variants, so
  // server and client render identically and there's nothing to hydrate.
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark")
    document.documentElement.classList.toggle("light", !dark)
    localStorage.setItem("theme", dark ? "dark" : "light")
  }
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      onClick={toggle}
      aria-label="Toggle color theme"
    >
      <Moon className="size-5 dark:hidden" />
      <Sun className="hidden size-5 dark:block" />
    </Button>
  )
}
