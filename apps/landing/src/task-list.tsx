import { Checkbox } from "@doska/ui-kit"
import type { Task } from "./tasks"

export function TaskList({
  tasks,
  onToggle,
}: {
  tasks: Task[]
  onToggle: (index: number) => void
}) {
  return (
    <ul>
      {tasks.map((task, i) => (
        <li key={task.label} className="task-list-item">
          <Checkbox
            checked={task.done}
            onCheckedChange={() => onToggle(i)}
            aria-label={task.label}
            className="-mt-0.5 mr-1.5 inline-flex cursor-pointer align-middle"
          />
          {task.label}
        </li>
      ))}
    </ul>
  )
}
