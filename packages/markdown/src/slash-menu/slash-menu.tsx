import { SlashMenuDropdown } from "./slash-menu-dropdown"
import { useSlashMenu } from "./use-slash-menu"
import type { SlashCommand } from "./commands"

interface IProps {
  /**
   * Ref to the textarea the menu attaches to,
   * should have relative container.
   */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  /** Current textarea value (controlled). */
  value: string
  /** Applies an inserted command back to the controlled value. */
  onChangeValue: (value: string) => void
  /** Overrides the default slash commands. */
  commands?: SlashCommand[]
  /** Disables the menu without unmounting (e.g. in preview). */
  enabled?: boolean
}

/**
 * The `/` slash command menu for a textarea.
 */
export function SlashMenu({
  textareaRef,
  value,
  onChangeValue,
  commands,
  enabled,
}: IProps) {
  const { menu, activeIndex, select, setActiveIndex } = useSlashMenu(
    textareaRef,
    { value, onChangeValue, commands, enabled }
  )

  if (!menu) return null
  return (
    <SlashMenuDropdown
      items={menu.items}
      activeIndex={activeIndex}
      left={menu.left}
      top={menu.top}
      onSelect={select}
      onHighlight={setActiveIndex}
    />
  )
}
