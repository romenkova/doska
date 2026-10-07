import { describeEntry, useBoardMembers, type HistoryEntry } from "@doska/core"
import { useAuth } from "@/lib/hooks"
import { timeAgo } from "@/lib/time-ago"
import { UserAvatar } from "../accounts/user-avatar"

interface IProps {
  entry: HistoryEntry
}

export function HistoryRow({ entry }: IProps) {
  const { authed, userId } = useAuth()
  const { data: roster } = useBoardMembers(entry.boardId, !!authed)

  const isMe = entry.userId === null || entry.userId === userId
  const member = roster?.members.find(
    (member) => member.userId === entry.userId
  )
  const name = isMe ? "You" : (member?.username ?? "Unknown")

  return (
    <li className="flex items-start gap-3 py-2">
      <UserAvatar
        name={isMe || member ? name : null}
        image={member?.image ?? null}
        className="size-6"
        fallbackClassName="text-[10px]"
      />
      <div className="flex min-w-0 flex-col">
        <span className="text-sm">
          <span className="font-medium">{name}</span> {describeEntry(entry)}
        </span>
        <span className="text-xs text-muted-foreground">
          {timeAgo(entry.createdAt)}
        </span>
      </div>
    </li>
  )
}
