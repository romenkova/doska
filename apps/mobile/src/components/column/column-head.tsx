import { useRenameColumn, useSetColumnCollapsed } from "@doska/core/mutations"
import type { Column } from "@doska/core/types"
import { IconButton, TextField } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { router } from "expo-router"
import ChevronDown from "lucide-react-native/icons/chevron-down"
import ChevronRight from "lucide-react-native/icons/chevron-right"
import CircleCheck from "lucide-react-native/icons/circle-check"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import Plus from "lucide-react-native/icons/plus"
import { useState } from "react"
import { View } from "react-native"
import { ROUTES } from "@/lib/routes"
import { ColumnSwatch } from "./column-swatch"

interface IProps {
  deckId: string
  column: Column
  /** Omit to hide the add button, as while a tag filter would hide the new card. */
  onAddCard?: () => void
}

/** A column's section in the board list: swatch, editable title, add card,
 * and the actions it keeps behind a `⋯`. */
export function ColumnHead({ deckId, column, onAddCard }: IProps) {
  const { mutedForeground } = useTokens()
  const { mutate: rename } = useRenameColumn(deckId)
  const { mutate: setCollapsed } = useSetColumnCollapsed(deckId)

  // The field is a draft until it commits, but a rename arriving from sync has
  // to replace what is sitting in it.
  const [draft, setDraft] = useState(column.title)
  const [committed, setCommitted] = useState(column.title)
  if (column.title !== committed) {
    setCommitted(column.title)
    setDraft(column.title)
  }

  function commitTitle() {
    const next = draft.trim()
    if (!next || next === column.title) {
      setDraft(column.title)
      return
    }
    rename({ id: column.id, title: next })
  }

  return (
    <View className="flex-row items-center justify-between gap-2 px-1 pt-4">
      <View className="flex-1 flex-row items-center gap-1.5">
        <IconButton
          icon={column.collapsed ? ChevronRight : ChevronDown}
          label={`${column.collapsed ? "Expand" : "Collapse"} ${column.title}`}
          variant="plain"
          size={16}
          onPress={() =>
            setCollapsed({ id: column.id, collapsed: !column.collapsed })
          }
        />
        <ColumnSwatch color={column.color} />
        <TextField
          value={draft}
          onChangeText={setDraft}
          onBlur={commitTitle}
          onSubmitEditing={commitTitle}
          returnKeyType="done"
          accessibilityLabel={`Rename ${column.title}`}
          placeholder="Untitled column"
          className="shrink text-[16px] font-sans-medium text-muted-foreground"
        />
        {/* The only place the flag shows — its toggle lives in the sheet. */}
        {column.done ? (
          <CircleCheck
            size={16}
            color={mutedForeground}
            accessibilityLabel={`${column.title} is the done column`}
          />
        ) : null}
      </View>

      <View className="flex-row items-center gap-1">
        {onAddCard ? (
          <IconButton
            icon={Plus}
            label={`Add card to ${column.title}`}
            onPress={onAddCard}
          />
        ) : null}
        <IconButton
          icon={MoreHorizontal}
          label={`${column.title} actions`}
          onPress={() => router.push(ROUTES.columnActions(column.id))}
        />
      </View>
    </View>
  )
}
