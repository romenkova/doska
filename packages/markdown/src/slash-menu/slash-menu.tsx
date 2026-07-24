import { useIsMobile } from "@doska/ui-kit"
import { DEFAULT_SLASH_COMMANDS, type SlashCommand } from "./commands"
import { SlashMenuDropdown } from "./slash-menu-dropdown"
import { SlashMenuFab } from "./slash-menu-fab"
import { useSlashMenu } from "./use-slash-menu"

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
  enabled = true,
}: IProps) {
  const isMobile = useIsMobile()
  const { menu, activeIndex, select, setActiveIndex, insertCommand } =
    useSlashMenu(textareaRef, {
      value,
      onChangeValue,
      commands,
      enabled: enabled && !isMobile,
    })

  if (isMobile)
    return (
      <SlashMenuFab
        commands={commands ?? DEFAULT_SLASH_COMMANDS}
        onSelect={insertCommand}
      />
    )

  if (!menu) return null
  return (
    <SlashMenuDropdown
      items={menu.items}
      activeIndex={activeIndex}
      left={menu.left}
      top={menu.top}
      bottom={menu.bottom}
      onSelect={select}
      onHighlight={setActiveIndex}
    />
  )
}
