import {
  useMoveCardToColumn,
  useBoard,
  useCard,
  useCardDeckId,
  byPosition,
} from "@doska/core"
import { useTokens } from "@doska/ui-kit-mobile"
import Check from "lucide-react-native/icons/check"
import { Pressable, Text, View } from "react-native"
import { ColumnSwatch } from "@/components/column/column-swatch"

interface IProps {
  cardId: string
  onDone: () => void
}

/** Moves the card between the columns of its own board — which is not
 * necessarily the open one, since Upcoming lists every board's cards. */
export function CardMove({ cardId, onDone }: IProps) {
  const { data: deckId } = useCardDeckId(cardId)
  if (!deckId) return null

  return <Columns cardId={cardId} deckId={deckId} onDone={onDone} />
}

function Columns({ cardId, deckId, onDone }: IProps & { deckId: string }) {
  const tokens = useTokens()
  const { data: card } = useCard(cardId)
  const { data: board } = useBoard(deckId)
  const { mutate: moveCardToColumn } = useMoveCardToColumn()

  const columns = [...(board?.columns ?? [])].sort(byPosition)
  if (!card || columns.length === 0) return null

  return (
    <View>
      {columns.map((column) => {
        const current = column.id === card.columnId

        return (
          <Pressable
            key={column.id}
            disabled={current}
            onPress={() => {
              moveCardToColumn({ id: cardId, columnId: column.id })
              onDone()
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: current }}
            className="flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-muted"
          >
            <ColumnSwatch color={column.color} />
            <Text className="flex-1 text-[17px] font-sans text-card-foreground">
              {column.title || "Untitled column"}
            </Text>
            {current ? <Check size={20} color={tokens.primary} /> : null}
          </Pressable>
        )
      })}
    </View>
  )
}
