import type { ReactNode } from "react"
import { Markdown } from "./markdown"
import { toggleTaskByIndex } from "./task-progress"
import { cut, useMarkers } from "./markers"

const BOARD_MARKERS = [cut]

interface IProps {
  body: string
  /** Called with the new body when a task-list checkbox is toggled. */
  onChangeBody?: (body: string) => void
  /** Renders `attachment:<key>` image refs; see `Markdown`. */
  renderImage?: (attachmentKey: string, alt: string) => ReactNode
}

/**
 * Renders a board card's body
 */
export function MarkdownCardPreview({
  body,
  onChangeBody,
  renderImage,
}: IProps) {
  const { body: preview, applied } = useMarkers(body, BOARD_MARKERS, "card")
  const hasMore = applied.includes(cut.name)

  if (!preview) return null

  return (
    <>
      <Markdown
        renderImage={renderImage}
        onToggleTask={
          onChangeBody
            ? (index) => onChangeBody(toggleTaskByIndex(body, index))
            : undefined
        }
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
