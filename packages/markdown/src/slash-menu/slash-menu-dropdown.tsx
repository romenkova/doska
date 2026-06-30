import { SlashMenuList } from "./slash-menu-list"
import type { SlashCommand } from "./commands"

interface IProps {
  items: SlashCommand[]
  activeIndex: number
  /** Position of the dropdown's top-left, relative to the textarea wrapper. */
  left: number
  top: number
  onSelect: (command: SlashCommand) => void
  onHighlight: (index: number) => void
}

/** Desktop `/` dropdown: the shared list positioned at the caret. */
export function SlashMenuDropdown({
  items,
  activeIndex,
  left,
  top,
  onSelect,
  onHighlight,
}: IProps) {
  return (
    <SlashMenuList
      items={items}
      activeIndex={activeIndex}
      onSelect={onSelect}
      onHighlight={onHighlight}
      className="absolute z-50"
      style={{ left, top }}
    />
  )
}
