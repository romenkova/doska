import { useState } from "react"
import { Avatar, AvatarFallback, Button } from "@doska/ui-kit"
import { initials } from "@doska/core/utils"
import type { Member } from "@doska/core/types"
import { AccountTag } from "../../accounts/account-tag"

interface IProps {
  member: Member
  board: string
  isSelf: boolean
  isOwner: boolean
  onRemove: () => void
}

/**
 * One person on the board. The owner can take anyone else off it; anyone else
 * can take themselves off it, and nothing else. The confirmation is inline
 * rather than a second dialog — losing a board is worth spelling out, but not
 * worth stacking modals for.
 */
export function MemberRow({ member, board, isSelf, isOwner, onRemove }: IProps) {
  const [confirming, setConfirming] = useState(false)

  const leaving = isSelf && member.role !== "owner"
  const canRemove = leaving || (isOwner && member.role !== "owner")

  return (
    <li className="flex flex-col gap-2 border-b border-border p-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">
            {initials(member.username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">
            {member.username}
          </span>
          <div className="flex items-center gap-1">
            {member.role === "owner" && <AccountTag>Owner</AccountTag>}
            {isSelf && <AccountTag>You</AccountTag>}
          </div>
        </div>
        {canRemove && !confirming && (
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setConfirming(true)}
            >
              {leaving ? "Leave" : "Remove"}
            </Button>
          </div>
        )}
      </div>
      {confirming && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {leaving
              ? `"${board}" and its cards leave your devices.`
              : `"${board}" and its cards leave ${member.username}'s devices.`}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={onRemove}
            >
              {leaving ? "Leave board" : "Remove"}
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}
