import {
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  TagChip,
  cn,
  columnHue,
} from "@doska/ui-kit"
import { Check, Tag } from "lucide-react"
import { useState } from "react"
import {
  tagColor,
  toggleTag,
  useTagColors,
  useTagOptions,
  type Card,
  type CardPatch,
} from "@doska/core"
import { useDeck } from "@/providers/deck/deck-context"
import { NewTagInput } from "./new-tag-input"

const hasTag = (tags: string[], tag: string) =>
  tags.some((t) => t.toLowerCase() === tag.toLowerCase())

export function TagsSub({
  card,
  onPatch,
}: {
  card: Card
  onPatch: (patch: CardPatch) => void
}) {
  const { id: deckId } = useDeck()
  const options = useTagOptions(deckId)
  const tagColors = useTagColors(deckId)
  const [query, setQuery] = useState("")

  const attached = card.tags
  const needle = query.trim().replace(/^#/, "").toLowerCase()
  const shown = options
    .filter((option) => option.name.toLowerCase().includes(needle))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    )

  function add(tag: string) {
    if (!hasTag(attached, tag)) onPatch({ tags: [...attached, tag] })
  }

  return (
    <MenuSub>
      <MenuSubTrigger>
        <Tag />
        Tags
      </MenuSubTrigger>
      <MenuContent
        align="start"
        sideOffset={2}
        className="flex max-h-80 w-60 flex-col"
      >
        <NewTagInput onChangeQuery={setQuery} onAdd={add} />
        <MenuSeparator />
        {shown.length === 0 && (
          <p className="px-3 py-1.5 text-xs text-muted-foreground">
            {options.length === 0 ? "No tags on this board yet" : "No matches"}
          </p>
        )}
        <div className="overflow-y-auto">
          {shown.map((option) => (
            <MenuItem
              key={option.name}
              closeOnClick={false}
              onClick={() =>
                onPatch({ tags: toggleTag(attached, option.name) })
              }
              className="[&_svg]:size-3.5"
            >
              <TagChip
                label={option.name}
                hue={columnHue(tagColor(tagColors, option.name))}
                className="min-w-0"
              />
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {option.hint}
              </span>
              <Check
                className={cn(
                  "text-primary",
                  !hasTag(attached, option.name) && "invisible"
                )}
              />
            </MenuItem>
          ))}
        </div>
      </MenuContent>
    </MenuSub>
  )
}
