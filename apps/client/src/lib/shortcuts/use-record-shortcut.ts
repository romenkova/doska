import { useEffect, useState } from "react"
import {
  getShortcut,
  setShortcut,
  suspendShortcut,
  type ShortcutName,
} from "./api"
import { shortcutFromEvent } from "./format"

/** Records a global shortcut from the next key press; Escape cancels and the old one comes back. */
export function useRecordShortcut(name: ShortcutName) {
  const [value, setValue] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getShortcut(name).then(setValue)
  }, [name])

  useEffect(() => {
    if (!recording) return
    // Unregistered while recording.
    void suspendShortcut(name)
    let picked = false
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === "Escape") {
        setRecording(false)
        return
      }
      const next = shortcutFromEvent(e)
      if (!next) return
      picked = true
      setRecording(false)
      setShortcut(name, next)
        .then(() => {
          setValue(next)
          setError(null)
        })
        .catch(() => setError("That combination can't be used."))
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
      if (!picked && value) void setShortcut(name, value)
    }
  }, [recording, value, name])

  return { value, recording, error, start: () => setRecording(true) }
}
