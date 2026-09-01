import type { DroppableProvidedProps } from "@hello-pangea/dnd"
import type { ReactNode, Ref } from "react"
import { Button, cn } from "@doska/ui-kit"
import { Check, FoldVertical, Plus, UnfoldVertical } from "lucide-react"
import { ColumnSwatch } from "./column-swatch"
import { ColumnTitle } from "./column-title"

interface IProps {
  title: string
  color: string
  done: boolean
  showBody: boolean
  onToggleBody: () => void
  /** Omit to make the title fixed text. */
  onRename?: (title: string) => void
  /** The column menu, where the viewer can act on the column. */
  menu?: ReactNode
  /** Omit to drop the add-card button. */
  onAddCard?: () => void
  /** Drag state and wiring, supplied by the board's `Droppable`. */
  isDraggingOver?: boolean
  listRef?: Ref<HTMLDivElement>
  listProps?: DroppableProvidedProps
  children: ReactNode
}

/** A column: its head, then the box holding its cards. */
export function ColumnView({
  title,
  color,
  done,
  showBody,
  onToggleBody,
  onRename,
  menu,
  onAddCard,
  isDraggingOver,
  listRef,
  listProps,
  children,
}: IProps) {
  return (
    <div
      role="group"
      aria-label={title}
      className="flex w-full max-w-none shrink-0 snap-center flex-col overflow-y-auto overscroll-y-contain pb-6 xs:max-w-sm"
    >
      <div
        className={cn(
          "sticky top-0 z-10 flex h-15 shrink-0 items-center justify-between gap-2 px-4 py-3 md:px-0",
          "bg-background/80 backdrop-blur-xs",
          "text-muted-foreground"
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <ColumnSwatch color={color} labelled className="ml-1" />
          <div>
            <ColumnTitle title={title} onRename={onRename} />
            {/* The only place the flag shows — its toggle lives in the menu. */}
            {!!done && (
              <div className="absolute -mt-1 ml-2 text-xs text-muted-foreground/50">
                Marks cards as done
              </div>
            )}
          </div>
          {done && (
            <Check
              aria-label={`${title} is the done column`}
              className="-ml-2 size-4 shrink-0"
            />
          )}
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon-lg"
            aria-pressed={showBody}
            aria-label={
              showBody ? `Hide body in ${title}` : `Show body in ${title}`
            }
            onClick={onToggleBody}
          >
            {showBody ? <FoldVertical /> : <UnfoldVertical />}
          </Button>
          {menu}
        </div>
      </div>
      <div
        className={cn(
          "flex min-h-40 w-full shrink-0 flex-col rounded-2xl bg-background p-4 transition-colors",
          "border border-sidebar-primary-foreground",
          "shadow-inset",
          isDraggingOver && "bg-primary/5 dark:bg-sidebar/50"
        )}
      >
        {onAddCard && (
          <Button
            variant="muted"
            onClick={onAddCard}
            aria-label={`Add card to ${title}`}
            className="mb-3 w-full"
            tooltip={false}
          >
            <Plus />
          </Button>
        )}
        <div ref={listRef} {...listProps} className="flex flex-1 flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}
