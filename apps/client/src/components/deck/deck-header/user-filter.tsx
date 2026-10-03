import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@doska/ui-kit"
import { useBoardMembers } from "@doska/core"
import { useDeck } from "@/providers/deck/deck-context"
import { useAuth } from "@/lib/hooks"
import { UserAvatar } from "@/components/accounts/user-avatar"

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
                  <UserAvatar
                    name={member.username}
                    image={member.image}
                    className={cn(
                      "size-6 border border-border bg-background",
                      active && "border-primary"
                    )}
                    fallbackClassName={cn(
                      "bg-white text-[10px] font-medium text-foreground/70 dark:bg-muted",
                      active && "bg-primary/10 text-primary dark:bg-primary/20"
                    )}
                  />
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
