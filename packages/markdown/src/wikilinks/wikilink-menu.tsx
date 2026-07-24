import { useCallback } from "react"
import { AnchoredMenu, useTriggerMenu } from "../menu"
import { filterWikilinks, toWikilink, type WikilinkOption } from "./wikilink"

// `[[` followed by the query up to the caret. The query may contain spaces —
// card titles do — but stops at a bracket or line break.
const TRIGGER_RE = /\[\[([^[\]\n]*)$/

interface IProps {
  /** Ref to the textarea the menu attaches to; needs a relative container. */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  /** Current textarea value (controlled). */
  value: string
  /** Applies the inserted reference back to the controlled value. */
  onChangeValue: (value: string) => void
  /** Link targets on offer, already ordered for display. */
  options: WikilinkOption[]
  /** Disables the menu without unmounting (e.g. in preview). */
  enabled?: boolean
}

/**
 * The `[[` wikilink menu: search the offered targets by target or title and
 * insert a `[[target]]` link. Picking one writes the target, so the author
 * never has to know or type it themselves.
 */
export function WikilinkMenu({
  textareaRef,
  value,
  onChangeValue,
  options,
  enabled = true,
}: IProps) {
  const getItems = useCallback(
    (query: string) => filterWikilinks(options, query),
    [options]
  )

  const toInsert = useCallback((option: WikilinkOption) => {
    const text = toWikilink(option.target)
    return { text, caretOffset: text.length }
  }, [])

  const { menu, activeIndex, select, setActiveIndex } = useTriggerMenu(
    textareaRef,
    {
      value,
      onChangeValue,
      enabled,
      trigger: TRIGGER_RE,
      triggerLength: 2,
      getItems,
      toInsert,
    }
  )

  if (!menu) return null
  return (
    <AnchoredMenu
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
