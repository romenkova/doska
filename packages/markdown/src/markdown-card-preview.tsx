import { Markdown } from "./markdown"
import { toggleTaskByIndex } from "./task-progress"

interface IProps {
  /** The card body already reduced to the visible portion (before the cut). */
  preview: string
  /** The full, unreduced body — task toggles operate on this. */
  body: string
  /** Whether content was hidden by the cut marker, showing an "open to see more" hint. */
  hasMore: boolean
  /** Called with the new body when a task-list checkbox is toggled. */
  onChangeBody?: (body: string) => void
}

/**
 * Renders a board card's body
 */
export function MarkdownCardPreview({
  preview,
  body,
  hasMore,
  onChangeBody,
}: IProps) {
  if (!preview) return null

  return (
    <>
      <Markdown
        onToggleTask={
          onChangeBody
            ? (index) => onChangeBody(toggleTaskByIndex(body, index))
            : undefined
        }
        className="preview"
      >
        {preview}
      </Markdown>
      {hasMore && (
        <span className="text-muted-foreground select-none">
          Open to see more
        </span>
      )}
    </>
  )
}
