import {
  Avatar,
  AvatarFallback,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@doska/ui-kit"
import { initials, useBoardMembers } from "@doska/core"
import { useDeck } from "@/providers/deck/deck-context"
import { useAuth } from "@/lib/hooks"

/** Board members as a row of avatars; clicking one filters to their cards. */
export function UserFilter({ boardId }: { boardId: string }) {
  const { authed, userId } = useAuth()
  const { data: roster } = useBoardMembers(boardId, !!authed)
  const { userFilters = [], toggleUserFilter } = useDeck()

  const members = roster?.members ?? []
  if (!toggleUserFilter || members.length < 2) return null

  const me = members.filter((member) => member.userId === userId)
  const others = members.filter((member) => member.userId !== userId)

  return (
    <div className="mr-1 flex items-center -space-x-1.5">
      {[...me, ...others].map((member) => {
        const label = member.userId === userId ? "You" : member.username
        const active = userFilters.includes(member.userId)
        return (
          <Tooltip key={member.userId}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={`Filter by ${label}`}
                  aria-pressed={active}
                  onClick={() => toggleUserFilter(member.userId)}
                  className={cn(
                    "cursor-pointer rounded-full ring-2 ring-background transition-opacity hover:z-10 hover:opacity-100",
                    active && "z-10",
                    userFilters.length > 0 && !active && "opacity-50"
                  )}
                >
                  <Avatar className="size-6 bg-background">
                    <AvatarFallback
                      className={cn(
                        "border border-border bg-white text-[10px] font-medium text-foreground/70 dark:bg-muted",
                        active &&
                          "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                      )}
                    >
                      {initials(member.username)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              }
            />
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
