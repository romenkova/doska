import { useMoveCardToBoard } from "@doska/core/mutations"
import { useCardDeckId, useDashboards } from "@doska/core/queries"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import Check from "lucide-react-native/icons/check"
import { Pressable, Text, View } from "react-native"

interface IProps {
  cardId: string
  onDone: () => void
}

export function CardMoveToBoard({ cardId, onDone }: IProps) {
  const { data: deckId } = useCardDeckId(cardId)
  if (!deckId) return null

  return <Boards cardId={cardId} deckId={deckId} onDone={onDone} />
}

function Boards({ cardId, deckId, onDone }: IProps & { deckId: string }) {
  const tokens = useTokens()
  const { data: boards = [] } = useDashboards()
  const { mutate: moveCardToBoard } = useMoveCardToBoard(deckId)

  return (
    <View>
      {boards.map((board) => {
        const current = board.id === deckId

        return (
          <Pressable
            key={board.id}
            disabled={current}
            onPress={() => {
              moveCardToBoard({ id: cardId, boardId: board.id })
              onDone()
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: current }}
            className="flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-muted"
          >
            <Text className="flex-1 text-[17px] font-sans text-card-foreground">
              {board.title || "Untitled board"}
            </Text>
            {current ? <Check size={20} color={tokens.primary} /> : null}
          </Pressable>
        )
      })}
    </View>
  )
}
