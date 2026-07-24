import { AnchoredMenu } from "../menu"
import type { SlashCommand } from "./commands"

interface IProps {
  items: SlashCommand[]
  activeIndex: number
  /** Caret line, relative to the textarea wrapper. */
  left: number
  top: number
  bottom: number
  onSelect: (command: SlashCommand) => void
  onHighlight: (index: number) => void
}

/** Desktop `/` dropdown: the shared list anchored at the caret. */
export function SlashMenuDropdown({
  items,
  activeIndex,
  left,
  top,
  bottom,
  onSelect,
  onHighlight,
}: IProps) {
  return (
    <AnchoredMenu
      items={items}
      activeIndex={activeIndex}
      left={left}
      top={top}
      bottom={bottom}
      onSelect={onSelect}
      onHighlight={onHighlight}
    />
  )
}
