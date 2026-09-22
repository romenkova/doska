import { useMoveSidebarItem } from "@doska/core/mutations"
import type { SidebarTarget } from "@doska/core/operations"
import { useSidebarTree } from "@doska/core/queries"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import Check from "lucide-react-native/icons/check"
import Folder from "lucide-react-native/icons/folder"
import Inbox from "lucide-react-native/icons/inbox"
import { Pressable, Text, View } from "react-native"

interface IProps {
  boardId: string
  onDone: () => void
}

/** Puts the board in a folder, or back at the top level, at the end. */
export function BoardFolder({ boardId, onDone }: IProps) {
  const tokens = useTokens()
  const { data: nodes = [] } = useSidebarTree()
  const { mutate: move } = useMoveSidebarItem()

  const folders = nodes.flatMap((node) =>
    node.type === "folder" ? [node] : []
  )
  const home = folders.find((folder) =>
    folder.boards.some((board) => board.id === boardId)
  )
  // `index` counts with the board already taken out.
  const rootCount = nodes.filter(
    (node) => node.type === "folder" || node.dashboard.id !== boardId
  ).length

  const options = [
    {
      key: "root",
      label: "No folder",
      icon: Inbox,
      current: !home,
      target: { kind: "root", index: rootCount } satisfies SidebarTarget,
    },
    ...folders.map((folder) => ({
      key: folder.id,
      label: folder.title || "Untitled folder",
      icon: Folder,
      current: folder.id === home?.id,
      target: {
        kind: "folder",
        folderId: folder.id,
        index: folder.boards.filter((board) => board.id !== boardId).length,
      } satisfies SidebarTarget,
    })),
  ]

  return (
    <View>
      {options.map(({ key, label, icon: Icon, current, target }) => (
        <Pressable
          key={key}
          disabled={current}
          onPress={() => {
            move({ id: boardId, target })
            onDone()
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: current }}
          className="flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-muted"
        >
          <Icon size={20} color={tokens.mutedForeground} />
          <Text className="flex-1 text-[17px] font-sans text-card-foreground">
            {label}
          </Text>
          {current ? <Check size={20} color={tokens.primary} /> : null}
        </Pressable>
      ))}
    </View>
  )
}
