import { useRemoveMember, useBoardMembers, useConnection } from "@doska/core"
import { useAuth } from "@/lib/hooks"
import { AddMember } from "./add-member"
import { MemberRow } from "./member-row"

interface IProps {
  boardId: string
  title: string
}

/**
 * Everyone with access to the board
 */
export function ShareRoster({ boardId, title }: IProps) {
  const { userId } = useAuth()
  const connection = useConnection()
  const roster = useBoardMembers(boardId, true)
  const remove = useRemoveMember(boardId)

  // Sharing is the only part of the app that writes straight to the server, so
  // it is the only part with nothing useful to do while the server is away.
  if (connection.status === "dropped")
    return (
      <p className="text-sm text-muted-foreground">
        Sharing needs the server, and it can not be reached right now. Nothing
        has changed.
      </p>
    )

  if (roster.isPending)
    return <p className="text-xs text-muted-foreground">Loading…</p>
  if (roster.error)
    return <p className="text-xs text-destructive">{roster.error.message}</p>

  const { members, viewerRole } = roster.data
  const isOwner = viewerRole === "owner"

  return (
    <div className="flex flex-col gap-4">
      {isOwner && <AddMember boardId={boardId} members={members} />}
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">
          {members.length} {members.length === 1 ? "member" : "members"}
        </div>
        <ul className="flex flex-col rounded-lg border border-border">
          {members.map((member) => (
            <MemberRow
              key={member.userId}
              member={member}
              board={title}
              isSelf={member.userId === userId}
              isOwner={isOwner}
              onRemove={() => remove.mutate(member.userId)}
            />
          ))}
        </ul>
      </div>
      {remove.error && (
        <p className="text-xs text-destructive">{remove.error.message}</p>
      )}
    </div>
  )
}
