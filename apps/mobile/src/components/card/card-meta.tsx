import { taskProgress } from "@doska/markdown"
import { PriorityChip } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { Pressable, View } from "react-native"
import { DeadlineChip } from "@/components/card/deadline-chip"
import { TaskCount } from "@/components/card/task-count"
import { ROUTES } from "@/lib/routes"

interface IProps {
  cardId: string
  body: string
  deadline: string | null
  priority: string
  /** The card sits in the board's done column. */
  done: boolean
  /** Shows the bare calendar when there's no deadline, as the way to set one. */
  showEmpty?: boolean
}

export function CardMeta({
  cardId,
  body,
  deadline,
  priority,
  done,
  showEmpty,
}: IProps) {
  const tasks = taskProgress(body)

  return (
    <View className="flex-row items-center gap-4">
      {tasks.total > 0 && <TaskCount {...tasks} />}
      {/* Nested in the board card's Pressable, which it shadows: the chip is
          the deadline control on the card as well as in its sheet. */}
      {(showEmpty || !!deadline) && (
        <Pressable
          onPress={() => router.push(ROUTES.cardDeadline(cardId))}
          accessibilityRole="button"
          accessibilityLabel="Due date"
          hitSlop={6}
        >
          <DeadlineChip value={deadline} done={done} />
        </Pressable>
      )}
      {priority ? (
        <Pressable
          onPress={() => router.push(ROUTES.cardPriority(cardId))}
          accessibilityRole="button"
          accessibilityLabel="Priority"
          hitSlop={6}
        >
          <PriorityChip value={priority} />
        </Pressable>
      ) : null}
    </View>
  )
}
