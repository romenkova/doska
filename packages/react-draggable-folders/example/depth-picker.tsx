import { cn } from "./cn"
import { type Depth, DEPTHS } from "./depth"

interface IProps {
  value: Depth
  onChange: (depth: Depth) => void
}

export function DepthPicker({ value, onChange }: IProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      Folder depth
      <div className="flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
        {DEPTHS.map((depth) => (
          <button
            key={depth}
            type="button"
            onClick={() => onChange(depth)}
            className={cn(
              "h-6 min-w-7 rounded-md px-2 font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
              depth === value &&
                "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
            )}
          >
            {depth}
          </button>
        ))}
      </div>
    </div>
  )
}
