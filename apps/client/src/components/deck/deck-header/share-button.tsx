import { useMemo, useState } from "react"
import { Button } from "@doska/ui-kit"
import { Globe, UserLock, Users } from "lucide-react"
import { useBoardMembers, usePublicBoardStatus } from "@doska/core"
import { ShareModal } from "../share/share-modal"
import { useAuth } from "@/lib/hooks"

interface IProps {
  boardId: string
  title: string
}

export function ShareButton({ boardId, title }: IProps) {
  const [open, setOpen] = useState(false)

  const { authed } = useAuth()
  const { data: roster } = useBoardMembers(boardId, !!authed)
  const { data: token } = usePublicBoardStatus(boardId, !!authed)

  const members = roster?.members.length ?? 0
  const { Icon, label } = useMemo(() => {
    if (token) return { Icon: Globe, label: "Shared with anyone with the link" }
    if (members > 1) return { Icon: Users, label: "Shared with members" }
    return { Icon: UserLock, label: "Private" }
  }, [token, members])

  if (!authed) return null

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Share: ${label}`}
        className="text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Icon />
      </Button>
      <ShareModal
        open={open}
        onOpenChange={setOpen}
        boardId={boardId}
        title={title}
      />
    </>
  )
}
