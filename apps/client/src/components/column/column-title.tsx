import { InvisibleInput } from "@doska/ui-kit"

interface IProps {
  title: string
  /** Omit where the title cannot be changed. */
  onRename?: (title: string) => void
}

/** A column's name, editable in place wherever renaming is possible. */
export function ColumnTitle({ title, onRename }: IProps) {
  if (!onRename)
    return <span className="line-clamp-1 px-2">{title}</span>

  return (
    <InvisibleInput
      value={title}
      onCommit={onRename}
      label={`Rename ${title}`}
      title="Click to rename"
    />
  )
}
