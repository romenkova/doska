import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardId,
  CardTitle,
  DeadlineChip,
  TaskIndicator,
} from "@doska/ui-kit"
import type { ReactNode } from "react"

/**
 * A board card. Same ui-kit slots as the app's card, and the body sits in
 * `.markdown` so it picks up the renderer's typography without shipping it.
 */
export function BoardCard({
  id,
  title,
  deadline,
  tasks,
  children,
}: {
  id: string
  title: string
  /** Fixed dates only — a relative one ("in 3 days") would break prerendering. */
  deadline?: string
  tasks?: { done: number; total: number }
  children: ReactNode
}) {
  return (
    <Card className="mb-3">
      <CardHeader>
        <CardTitle className="font-bold">
          <h3>{title}</h3>
        </CardTitle>
        <CardAction>
          <CardId id={id} />
        </CardAction>
      </CardHeader>
      {(tasks || deadline) && (
        <CardContent>
          <div className="mt-2 flex items-center gap-2 text-sm">
            {tasks && <TaskIndicator done={tasks.done} total={tasks.total} />}
            {deadline && <DeadlineChip value={deadline} done={false} />}
          </div>
        </CardContent>
      )}
      <CardContent className="pt-2">
        <div className="markdown preview">{children}</div>
      </CardContent>
    </Card>
  )
}
