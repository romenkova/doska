import { useRenameDashboard } from "@doska/core/mutations"
import type { Dashboard } from "@doska/core/types"
import { IconButton, TextField } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import Search from "lucide-react-native/icons/search"
import { useState } from "react"
import { ScreenHeader } from "@/components/shell/screen-header"
import { ROUTES } from "@/lib/routes"

interface IProps {
  board: Dashboard
}

/** The board's top bar: the drawer toggle, the editable board name, and the
 * actions the web keeps behind its `⋯` menu — here a sheet route. */
export function BoardHeader({ board }: IProps) {
  const { mutate: rename } = useRenameDashboard()

  // The field is a draft until it commits, but a rename arriving from sync — or
  // a switch to another board — has to replace what is sitting in it.
  const [draft, setDraft] = useState(board.title)
  const [committed, setCommitted] = useState(board.title)
  if (board.title !== committed) {
    setCommitted(board.title)
    setDraft(board.title)
  }

  function commitTitle() {
    const next = draft.trim()
    if (!next || next === board.title) {
      setDraft(board.title)
      return
    }
    rename({ id: board.id, name: next })
  }

  return (
    <ScreenHeader>
      <TextField
        value={draft}
        onChangeText={setDraft}
        onBlur={commitTitle}
        onSubmitEditing={commitTitle}
        returnKeyType="done"
        accessibilityLabel="Board name"
        placeholder="Untitled board"
        className="flex-1 px-1 text-base font-sans-semibold text-sidebar-foreground"
      />
      <IconButton
        icon={Search}
        label="Search cards"
        onPress={() => router.push(ROUTES.search)}
      />
      <IconButton
        icon={MoreHorizontal}
        label="Board actions"
        onPress={() => router.push(ROUTES.boardActions)}
      />
    </ScreenHeader>
  )
}
