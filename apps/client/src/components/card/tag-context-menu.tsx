import {
  ContextMenu,
  ContextMenuTrigger,
  MenuContent,
  MenuItem,
  MenuSeparator,
  useIsMobile,
} from "@doska/ui-kit"
import {
  hasTag,
  tagColor,
  useIsBoardOwner,
  useSetTagColor,
  useTagColors,
} from "@doska/core"
import { Filter, Tags } from "lucide-react"
import type { ReactNode } from "react"
import { useDeck } from "@/providers/deck/deck-context"
import { ColumnColorSubmenu } from "../column/column-color"
import { useManageTags } from "../manage-tags/use-manage-tags"

interface IProps {
  tag: string
  children: ReactNode
}

export function TagContextMenu({ tag, children }: IProps) {
  const { id: deckId, tagFilters = [], toggleTagFilter } = useDeck()
  const { open: openManageTags } = useManageTags()
  const isMobile = useIsMobile()
  const isOwner = useIsBoardOwner(deckId)
  const colors = useTagColors(deckId)
  const setTagColor = useSetTagColor(deckId)

  // No board id on the public view, which is read-only
  if (isMobile || !deckId) return children

  return (
    <ContextMenu>
      <ContextMenuTrigger render={<span />}>{children}</ContextMenuTrigger>
      <MenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {toggleTagFilter && (
          <MenuItem onClick={() => toggleTagFilter(tag)}>
            <Filter />
            {hasTag(tagFilters, tag)
              ? `Stop filtering by #${tag}`
              : `Filter by #${tag}`}
          </MenuItem>
        )}
        {isOwner && (
          <ColumnColorSubmenu
            color={tagColor(colors, tag)}
            onChange={(color) => setTagColor.mutate({ tag, color })}
          />
        )}
        <MenuSeparator />
        <MenuItem onClick={() => openManageTags(deckId)}>
          <Tags />
          Manage tags…
        </MenuItem>
      </MenuContent>
    </ContextMenu>
  )
}
