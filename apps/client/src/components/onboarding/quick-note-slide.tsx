import { Markdown } from "@doska/ui-kit"
import { useRecordShortcut } from "@/lib/shortcuts/use-record-shortcut"
import { ShortcutButtons } from "../quick-note/shortcut-buttons"
import quickNote from "./slides/quick-note.md?raw"

export function QuickNoteSlide() {
  const recorder = useRecordShortcut("quick-note")

  return (
    <>
      <Markdown>{quickNote}</Markdown>
      <div className="mt-8">
        <ShortcutButtons recorder={recorder} />
      </div>
      {recorder.error && (
        <p className="mt-2 text-xs text-destructive">{recorder.error}</p>
      )}
    </>
  )
}
