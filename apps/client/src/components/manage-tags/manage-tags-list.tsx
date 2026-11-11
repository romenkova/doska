import { CardContent, ModalDescription } from "@doska/ui-kit"
import {
  tagColor,
  useDeleteTag,
  useIsBoardOwner,
  useRenameTag,
  useSetTagColor,
  useTagColors,
  useTagOptions,
} from "@doska/core"
import { useState } from "react"
import { ConfirmDialog } from "../confirm-dialog"
import { TagRow } from "./tag-row"

interface IProps {
  boardId: string
}

export function ManageTagsList({ boardId }: IProps) {
  const isOwner = useIsBoardOwner(boardId)
  const options = useTagOptions(boardId)
  const colors = useTagColors(boardId)
  const renameTag = useRenameTag(boardId)
  const deleteTag = useDeleteTag(boardId)
  const setTagColor = useSetTagColor(boardId)
  const [deleting, setDeleting] = useState<string | null>(null)

  return (
    <CardContent className="py-4">
      <div className="flex flex-col gap-4">
        <ModalDescription>
          {options.length === 0
            ? "No cards on this board have tags yet."
            : "Changes apply to every card on this board. Renaming onto an existing tag merges them."}
        </ModalDescription>
        {options.length > 0 && (
          <ul className="flex max-h-96 flex-col gap-1 overflow-y-auto">
            {options.map((option) => (
              <TagRow
                // Remount after a rename so the input resets to the new name
                key={option.name}
                name={option.name}
                hint={option.hint}
                color={tagColor(colors, option.name)}
                onChangeColor={
                  isOwner
                    ? (color) => setTagColor.mutate({ tag: option.name, color })
                    : null
                }
                onRename={(to) => renameTag.mutate({ from: option.name, to })}
                onDelete={() => setDeleting(option.name)}
              />
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(next) => {
          if (!next) setDeleting(null)
        }}
        title={`Delete #${deleting ?? ""}?`}
        description="The tag comes off every card on this board. Mentions in card bodies stay as they are."
        confirmLabel="Delete tag"
        onConfirm={() => {
          if (deleting) deleteTag.mutate(deleting)
        }}
      />
    </CardContent>
  )
}
