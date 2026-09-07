import { Button } from "@doska/ui-kit"
import { isDesktop } from "@/lib/platform"
import { formatShortcut } from "@/lib/shortcuts/format"
import { useRecordShortcut } from "@/lib/shortcuts/use-record-shortcut"
import { SettingsSection } from "../section"

/** The global hotkey that opens the quick-note popup; desktop only. */
export function QuickNoteSection() {
  if (!isDesktop()) return null
  return <Shortcut />
}

function Shortcut() {
  const { value, recording, error, start } = useRecordShortcut("quick-note")

  return (
    <SettingsSection title="Quick note">
      <div className="flex items-center justify-between gap-3">
        <span className="flex flex-col gap-1">
          <span className="text-sm">Shortcut</span>
          <span className="text-xs text-muted-foreground">
            {error ?? "Opens the quick note from anywhere."}
          </span>
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-w-24 font-mono"
          onClick={start}
        >
          {recording ? "Press keys…" : value ? formatShortcut(value) : "…"}
        </Button>
      </div>
    </SettingsSection>
  )
}
