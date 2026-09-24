import { columnHue, MdWikilink } from "@doska/ui-kit"
import type { CardRef } from "./bridge"
import { post } from "./native"

interface IProps {
  target: string
  alias?: string
  refs: CardRef[]
}

export function CardRefLink({ target, alias, refs }: IProps) {
  const ref = refs.find((r) => r.target === target)

  if (!ref)
    return (
      <MdWikilink
        target={target}
        label={alias}
        unresolved
        title="No such card"
      />
    )

  return (
    <MdWikilink
      target={target}
      label={alias || ref.title || "Untitled card"}
      badge={ref.column || undefined}
      hue={columnHue(ref.color)}
      done={ref.done}
      onOpen={() => post({ type: "openRef", id: ref.id })}
    />
  )
}
