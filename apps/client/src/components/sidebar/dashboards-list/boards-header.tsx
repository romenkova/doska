import { Button, SidebarGroupLabel } from "@doska/ui-kit"
import { Folder, Plus } from "lucide-react"
import { useDashboardNav } from "@/lib/hooks"

interface IProps {
  onNewFolder: () => void
}

export function BoardsHeader({ onNewFolder }: IProps) {
  const { createAndOpenDashboard } = useDashboardNav()
  return (
    <SidebarGroupLabel className="mb-1 gap-1 rounded-none pr-0">
      <span className="flex-1 text-sm">Boards</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="New folder"
        className="text-muted-foreground"
        onClick={onNewFolder}
      >
        <Folder />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="New board"
        className="text-muted-foreground"
        onClick={createAndOpenDashboard}
      >
        <Plus />
      </Button>
    </SidebarGroupLabel>
  )
}
