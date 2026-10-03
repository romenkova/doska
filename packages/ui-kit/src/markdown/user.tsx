import { AtSign } from "lucide-react"
import { TagChip } from "../tag-chip"

/** `@user` in a card body. */
export function MdUser({ name }: { name: string }) {
  return <TagChip label={name} icon={AtSign} className="mx-[0.1em]" />
}
