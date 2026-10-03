import { Button, InvisibleInput } from "@doska/ui-kit"
import { Plus } from "lucide-react"
import { PageHeader } from "../../app/page-header"
import { BoardActionsMenu } from "./board-actions-menu"
import { SearchButton } from "./search-button"
import { RowViewButton } from "./row-view-button"
import { ShareButton } from "./share-button"
import type { Column, DashboardView } from "@doska/core"
import { VaultButton } from "./vault-button"
import { isDesktop } from "@/lib/platform"

interface IProps {
  boardId: string
  title: string
  columns: Column[]
  sort: string[]
  view: DashboardView
  onRename: (name: string) => void
  onDelete: () => void
  onReorderColumns: (changed: Column[]) => void
  onChangeSort: (sort: string[]) => void
  onChangeView: (view: DashboardView) => void
  /** Omitted while the board has no column to put a card in. */
  onAddCard?: () => void
}

export function DeckHeader({
  boardId,
  title,
  columns,
  sort,
  view,
  onRename,
  onDelete,
  onReorderColumns,
  onChangeSort,
  onChangeView,
  onAddCard,
}: IProps) {
  return (
    <PageHeader>
      <InvisibleInput
        value={title}
        onCommit={onRename}
        label="Board name"
        className="min-w-40 text-base font-semibold sm:min-w-68"
      />

      <div className="ml-auto flex items-center gap-1">
        {onAddCard && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Add card"
            className="text-muted-foreground"
            onClick={onAddCard}
          >
            <Plus />
          </Button>
        )}
        <SearchButton boardId={boardId} />
        <RowViewButton view={view} onChangeView={onChangeView} />
        <ShareButton boardId={boardId} title={title} />
        {isDesktop() && <VaultButton boardId={boardId} />}
        <BoardActionsMenu
          title={title}
          columns={columns}
          sort={sort}
          onChangeSort={onChangeSort}
          onDelete={onDelete}
          onReorderColumns={onReorderColumns}
        />
      </div>
    </PageHeader>
  )
}
