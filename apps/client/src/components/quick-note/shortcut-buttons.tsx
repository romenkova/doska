import { Button } from "@doska/ui-kit"
import { formatShortcut } from "@/lib/shortcuts/format"
import type { useRecordShortcut } from "@/lib/shortcuts/use-record-shortcut"

interface IProps {
  recorder: ReturnType<typeof useRecordShortcut>
}

export function ShortcutButtons({ recorder }: IProps) {
  const { value, recording, start, clear } = recorder

  return (
    <span className="flex items-center gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="min-w-24 font-mono"
        onClick={start}
      >
        {recording ? "Press keys…" : value ? formatShortcut(value) : "Set"}
      </Button>
      {value && !recording && (
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          Clear
        </Button>
      )}
    </span>
  )
}
