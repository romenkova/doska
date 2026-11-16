import { Button, Menu, MenuContent, MenuItem, MenuTrigger } from "@doska/ui-kit"
import { FolderOpen, Plus, SquareDashedPlus, SquareText } from "lucide-react"
import { useDashboards, useFillBoard } from "@doska/core"
import { useVaultContext } from "@/providers/vault/vault-context"
import { CenteredState } from "../digest/centered-state"

interface IProps {
  boardId: string
}

/** A board with no columns: start it from a folder, a template, or blank. */
export function BoardEmptyState({ boardId }: IProps) {
  const vault = useVaultContext()
  const { data: dashboards = [] } = useDashboards()
  const { mutate: fill, isPending } = useFillBoard(boardId)
  const templates = dashboards.filter((d) => d.template && d.id !== boardId)

  return (
    <div className="flex w-full items-center justify-center px-4">
      <CenteredState
        icon={<SquareDashedPlus className="size-8 text-muted-foreground" />}
      >
        <p className="text-sm text-muted-foreground">
          This board is empty. How do you want to start?
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {vault.available && (
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => void vault.mount()}
            >
              <FolderOpen />
              From folder
            </Button>
          )}
          <Menu>
            <MenuTrigger
              render={
                <Button
                  variant="secondary"
                  disabled={isPending || templates.length === 0}
                  tooltip={
                    templates.length === 0 ? "No board templates yet" : false
                  }
                />
              }
            >
              <SquareText />
              From template
            </MenuTrigger>
            <MenuContent>
              {templates.map((template) => (
                <MenuItem key={template.id} onClick={() => fill(template.id)}>
                  {template.title || "Untitled board"}
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => fill(undefined)}
          >
            <Plus />
            Empty
          </Button>
        </div>
        {vault.error && (
          <p className="text-sm text-destructive">{vault.error}</p>
        )}
      </CenteredState>
    </div>
  )
}
