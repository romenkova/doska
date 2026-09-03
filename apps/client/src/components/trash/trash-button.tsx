import { Button, cn } from "@doska/ui-kit"
import { Trash2 } from "lucide-react"
import { useLocation } from "wouter"
import { routes } from "@/lib/routes"

/** Sidebar entry that opens the trash. */
export function TrashButton() {
  const [location, navigate] = useLocation()
  const isActive = location === routes.trash()

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("justify-start gap-2 px-2", isActive && "bg-muted")}
      onClick={() => navigate(`~${routes.trash()}`)}
    >
      <Trash2 className="size-4" />
      <span>Trash</span>
    </Button>
  )
}
