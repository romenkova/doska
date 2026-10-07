import { Fragment } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@doska/ui-kit"
import { describeEntry, useBoardMembers, type HistoryEntry } from "@doska/core"
import { useAuth } from "@/lib/hooks"
import { timeAgo } from "@/lib/time-ago"
import { UserAvatar } from "../accounts/user-avatar"
import { HistoryPart } from "./history-part"

interface IProps {
  entry: HistoryEntry
}

export function HistoryRow({ entry }: IProps) {
  const { authed, userId, login, image } = useAuth()
  const { data: roster } = useBoardMembers(entry.boardId, !!authed)

  const members = roster?.members ?? []
  const isMe = entry.userId === null || entry.userId === userId
  const member = members.find((member) => member.userId === entry.userId)
  const name = isMe ? "You" : (member?.username ?? "Unknown")

  return (
    <li className="flex items-start gap-3 py-2">
      <UserAvatar
        name={isMe ? login : (member?.username ?? null)}
        image={isMe ? image : (member?.image ?? null)}
        className="size-6"
        fallbackClassName="text-[10px]"
      />
      <p className="min-w-0 flex-1 text-sm leading-6 text-muted-foreground">
        <span className="font-medium text-foreground">{name}</span>
        {describeEntry(entry).map((part, index) => (
          <Fragment key={index}>
            {" "}
            <HistoryPart part={part} members={members} />
          </Fragment>
        ))}
      </p>
      <Tooltip>
        <TooltipTrigger
          render={
            <time
              dateTime={new Date(entry.createdAt).toISOString()}
              className="shrink-0 text-xs leading-6 text-muted-foreground"
            />
          }
        >
          {timeAgo(entry.createdAt)}
        </TooltipTrigger>
        <TooltipContent>
          {new Date(entry.createdAt).toLocaleString()}
        </TooltipContent>
      </Tooltip>
    </li>
  )
}
