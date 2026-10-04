import { MenuContent, MenuItem, MenuSub, MenuSubTrigger } from "@doska/ui-kit"
import { AtSign, Check } from "lucide-react"
import { useUpdateCard, useCard, useBoardMembers } from "@doska/core"
import { useDeck } from "@/providers/deck/deck-context"
import { useAuth } from "@/lib/hooks"

export function UsersSub({ cardId }: { cardId: string }) {
  const { id: deckId } = useDeck()
  const { authed } = useAuth()
  const { data: card } = useCard(cardId)
  const { mutate: updateCard } = useUpdateCard(cardId)
  const { data: roster } = useBoardMembers(deckId, !!authed)

  if (!authed) return null

  const attached = card?.users ?? []

  function toggle(userId: string) {
    const next = attached.includes(userId)
      ? attached.filter((id) => id !== userId)
      : [...attached, userId]
    updateCard({ users: next })
  }

  return (
    <MenuSub>
      <MenuSubTrigger>
        <AtSign />
        Users
      </MenuSubTrigger>
      <MenuContent
        align="start"
        sideOffset={2}
        className="max-h-80 w-56 overflow-y-auto"
      >
        {roster?.members.map((member) => (
          <MenuItem
            key={member.userId}
            closeOnClick={false}
            onClick={() => toggle(member.userId)}
          >
            @{member.username}
            {attached.includes(member.userId) && <Check className="ml-auto" />}
          </MenuItem>
        ))}
      </MenuContent>
    </MenuSub>
  )
}
