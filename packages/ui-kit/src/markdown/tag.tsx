import { TagChip } from "../tag-chip"

interface IProps {
  name: string
}

/** A `#tag` in a card body. */
export function MdTag({ name }: IProps) {
  return <TagChip label={name} className="mx-[0.1em]" />
}
