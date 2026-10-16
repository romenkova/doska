import { isDesktop } from "@/lib/platform"
import { useRecordShortcut } from "@/lib/shortcuts/use-record-shortcut"
import { ShortcutButtons } from "../../quick-note/shortcut-buttons"
import { SettingsSection } from "../section"

/** The global hotkey that opens the quick-note popup; desktop only. */
export function QuickNoteSection() {
  if (!isDesktop()) return null
  return <Shortcut />
}

function Shortcut() {
  const recorder = useRecordShortcut("quick-note")

  return (
    <SettingsSection title="Quick note">
      <div className="flex items-center justify-between gap-3">
        <span className="flex flex-col gap-1">
          <span className="text-sm">Shortcut</span>
          <span className="text-xs text-muted-foreground">
            {recorder.error ?? "Opens the quick note from anywhere."}
          </span>
        </span>
        <ShortcutButtons recorder={recorder} />
      </div>
    </SettingsSection>
  )
}
