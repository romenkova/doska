import { useState } from "react"
import { UserPlus } from "lucide-react"
import { Button, Input } from "@doska/ui-kit"
import { useAddMember, useDirectory, type Member } from "@doska/core"

interface IProps {
  boardId: string
  members: Member[]
}

/** Above this the picker is a haystack, so it gets a filter. */
const FILTER_FROM = 6

/** The picker: every account on the server that is not already on the board. */
export function AddMember({ boardId, members }: IProps) {
  const [filter, setFilter] = useState("")
  const directory = useDirectory(true)
  const add = useAddMember(boardId)

  const onBoard = new Set(members.map((member) => member.userId))
  const candidates = (directory.data ?? []).filter(
    (account) => !onBoard.has(account.id)
  )
  const needle = filter.trim().toLowerCase()
  const shown = needle
    ? candidates.filter((account) =>
        account.username.toLowerCase().includes(needle)
      )
    : candidates

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <UserPlus className="size-4 text-muted-foreground" />
        Add someone
      </div>
      {directory.isPending && (
        <p className="text-xs text-muted-foreground">Loading accounts…</p>
      )}
      {directory.error && (
        <p className="text-xs text-destructive">{directory.error.message}</p>
      )}
      {directory.data && candidates.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {directory.data.length > 1
            ? "Everyone on this server is already on this board."
            : "Nobody else has an account on this server yet."}
        </p>
      )}
      {candidates.length >= FILTER_FROM && (
        <Input
          placeholder="Search accounts"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      )}
      {candidates.length > 0 && (
        <ul className="flex max-h-48 flex-col overflow-y-auto">
          {shown.map((account) => (
            <li
              key={account.id}
              className="flex items-center gap-2 border-b py-2 last:border-b-0"
            >
              <span className="truncate text-sm">{account.username}</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="ml-auto shrink-0"
                disabled={add.isPending}
                onClick={() => add.mutate(account.id)}
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
      )}
      {add.error && (
        <p className="text-xs text-destructive">{add.error.message}</p>
      )}
    </div>
  )
}
