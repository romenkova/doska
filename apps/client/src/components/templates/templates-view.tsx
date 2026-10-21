import { useEffect } from "react"
import { SquareText } from "lucide-react"
import { sync, useDashboards, useTemplateCards } from "@doska/core"
import { PageHeader } from "../app/page-header"
import { CenteredState } from "../digest/centered-state"
import { BoardTemplateRow } from "./board-template-row"
import { CardTemplateRow } from "./card-template-row"

/** Everything marked as a template. Pulls every board, since a template card can
 * sit on one this device has not opened. */
export function TemplatesView() {
  const { data: dashboards = [], isPending } = useDashboards()
  const { data: cards = [] } = useTemplateCards()

  const boardIds = dashboards.map((d) => d.id).join(",")
  useEffect(() => {
    if (!boardIds) return
    void sync.reconcileBoards(boardIds.split(","))
  }, [boardIds])

  const boards = dashboards.filter((d) => d.template)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader>
        <h1 className="text-base font-semibold">Templates</h1>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-10">
        <div className="mx-auto flex max-w-lg flex-col gap-8">
          {!isPending && boards.length === 0 && cards.length === 0 && (
            <CenteredState
              icon={<SquareText className="size-8 text-muted-foreground" />}
            >
              <p className="max-w-sm text-sm text-muted-foreground">
                No templates yet. Pick "Add to templates" in a card's or a
                board's menu.
              </p>
            </CenteredState>
          )}

          {boards.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Boards
              </h2>
              <ul aria-label="Board templates" className="flex flex-col gap-2">
                {boards.map((board) => (
                  <BoardTemplateRow key={board.id} board={board} />
                ))}
              </ul>
            </section>
          )}

          {cards.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Cards
              </h2>
              <ul aria-label="Card templates" className="flex flex-col gap-2">
                {cards.map((entry) => (
                  <CardTemplateRow key={entry.card.id} entry={entry} />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
