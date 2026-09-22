import { Droppable } from "@hello-pangea/dnd"
import { useState, type ReactNode } from "react"
import { ConfirmDialog } from "../confirm-dialog"
import { ColumnMenu } from "./column-menu"
import { ColumnView } from "./column-view"

interface IProps {
  children: ReactNode
  id: string
  title: string
  color: string
  showBody: boolean
  onToggleBody: () => void
  onAddCard?: () => void
  onRename: (title: string) => void
  onChangeColor: (color: string) => void
  /** Cards in this column count as finished. */
  done: boolean
  onChangeDone: (done: boolean) => void
  onDelete: () => void
}

export function Column({
  children,
  id,
  title,
  color,
  showBody,
  onToggleBody,
  onAddCard,
  onRename,
  onChangeColor,
  done,
  onChangeDone,
  onDelete,
}: IProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <ColumnView
          title={title}
          color={color}
          done={done}
          showBody={showBody}
          onToggleBody={onToggleBody}
          onRename={onRename}
          onAddCard={onAddCard}
          isDraggingOver={snapshot.isDraggingOver}
          listRef={provided.innerRef}
          listProps={provided.droppableProps}
          menu={
            <>
              <ColumnMenu
                title={title}
                color={color}
                onChangeColor={onChangeColor}
                done={done}
                onChangeDone={onChangeDone}
                onDelete={() => setConfirmOpen(true)}
              />
              <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Delete column?"
                description={`"${title}" and all of its cards move to the trash, where they stay restorable for 14 days.`}
                confirmLabel="Delete column"
                onConfirm={onDelete}
              />
            </>
          }
        >
          {children}
          {provided.placeholder}
        </ColumnView>
      )}
    </Droppable>
  )
}
