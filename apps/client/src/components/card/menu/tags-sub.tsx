import {
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
} from "@doska/ui-kit"
import { Check, Tag } from "lucide-react"
import { useState } from "react"
import { useUpdateCard } from "@doska/core/mutations"
import { useCard } from "@doska/core/queries"
import { useTagOptions } from "@doska/core/tag-options"
import { toggleTag } from "@doska/core/utils"
import { useDeck } from "@/providers/deck/deck-context"
import { NewTagInput } from "./new-tag-input"

const hasTag = (tags: string[], tag: string) =>
  tags.some((t) => t.toLowerCase() === tag.toLowerCase())

export function TagsSub({ cardId }: { cardId: string }) {
  const { id: deckId } = useDeck()
  const { data: card } = useCard(cardId)
  const { mutate: updateCard } = useUpdateCard(cardId)
  const options = useTagOptions(deckId)
  const [query, setQuery] = useState("")

  const attached = card?.tags ?? []
  const shown = options.filter((option) =>
    option.name
      .toLowerCase()
      .includes(query.trim().replace(/^#/, "").toLowerCase())
  )

  function add(tag: string) {
    if (!hasTag(attached, tag)) updateCard({ tags: [...attached, tag] })
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
        className="flex max-h-80 w-56 flex-col"
      >
        <NewTagInput onChangeQuery={setQuery} onAdd={add} />
        {shown.length > 0 && <MenuSeparator />}
        <div className="overflow-y-auto">
          {shown.map((option) => (
            <MenuItem
              key={option.name}
              closeOnClick={false}
              onClick={() =>
                updateCard({ tags: toggleTag(attached, option.name) })
              }
            >
              #{option.name}
              {hasTag(attached, option.name) && <Check className="ml-auto" />}
            </MenuItem>
          ))}
        </div>
      </MenuContent>
    </MenuSub>
  )
}
