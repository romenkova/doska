import {
  Card as CardBase,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@doska/ui-kit"
import { cn } from "@doska/ui-kit"
import { fallbackCard } from "@/lib/seed"
import { useLocation } from "wouter"
import { routes } from "@/lib/routes"
import { CardContextMenu, CardMenu } from "./menu/card-menu"
import { CardDeadline } from "./deadline/card-deadline"
import { TaskIndicator } from "./task-indicator"
import { useCard } from "@/lib/data/queries"
import { useUpdateCard } from "@/lib/data/mutations"
import { todayIso } from "@/lib/utils"
import { MarkdownCardPreview, taskProgress } from "@doska/markdown"
import type { DetailedHTMLProps, HTMLAttributes } from "react"
import type { Column } from "@/lib/types"
import { CardAttachments } from "./attachments/card-attachments"

interface IProps extends DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> {
  id: string
  index: number
  showBody: boolean
  onDelete: () => void
  isDragging: boolean
  columns: Column[]
  currentColumnId: string
  onMoveToColumn: (columnId: string) => void
}

export function Card({
  id,
  showBody,
  onDelete,
  isDragging,
  columns,
  currentColumnId,
  onMoveToColumn,
  ...props
}: IProps) {
  const [, navigate] = useLocation()
  const { data: card = fallbackCard } = useCard(id)
  const { mutate: updateCard } = useUpdateCard(id)
  const { title, body, deadline } = card
  const attachments = card.attachments ?? []
  const { done, total } = taskProgress(body)
  const onAddDeadline = deadline
    ? undefined
    : () => updateCard({ deadline: todayIso() })

  return (
    <div
      {...props}
      className={cn(
        "group relative mb-3 w-full max-w-sm cursor-pointer rounded-lg",
        "touch-manipulation select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
      )}
    >
      <CardContextMenu
        onEdit={() => navigate(routes.card.to(id))}
        onDelete={onDelete}
        onAddDeadline={onAddDeadline}
        columns={columns}
        currentColumnId={currentColumnId}
        onMoveToColumn={onMoveToColumn}
      >
        <CardBase
          className={cn(
            showBody ? "gap-2" : "gap-0",
            isDragging && "shadow-shade/5 shadow-xl"
          )}
        >
          <CardHeader className={cn(!!deadline && !showBody && "mb-2")}>
            <CardTitle>{title || "Untitled card"}</CardTitle>
            <CardAction className="flex items-center gap-1">
              {total > 0 && <TaskIndicator done={done} total={total} />}
              <CardMenu
                onEdit={() => navigate(routes.card.to(id))}
                onDelete={onDelete}
                onAddDeadline={onAddDeadline}
                columns={columns}
                currentColumnId={currentColumnId}
                onMoveToColumn={onMoveToColumn}
              />
            </CardAction>
          </CardHeader>
          {!!deadline && (
            <CardContent>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <CardDeadline
                  value={deadline}
                  onChange={(deadline) => updateCard({ deadline })}
                />
              </div>
            </CardContent>
          )}

          {body.trim() && (
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                showBody ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <CardContent className="space-y-3 pt-2">
                  <MarkdownCardPreview
                    body={body}
                    onChangeBody={(body) => updateCard({ body })}
                  />
                </CardContent>
              </div>
            </div>
          )}
          {attachments.length > 0 && showBody && (
            <CardAttachments className="pt-2" cardId={id} isReadonly />
          )}
        </CardBase>
      </CardContextMenu>
    </div>
  )
}
