const MAC = navigator.userAgent.includes("Mac")
const MAC_GLYPHS: Record<string, string> = {
  Ctrl: "⌃",
  Alt: "⌥",
  Shift: "⇧",
  Super: "⌘",
}

export function shortcutFromEvent(e: KeyboardEvent): string | null {
  if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return null
  const parts = [
    e.ctrlKey && "Ctrl",
    e.altKey && "Alt",
    e.shiftKey && "Shift",
    e.metaKey && "Super",
  ].filter((p): p is string => Boolean(p))
  if (parts.length === 0) return null
  return [...parts, e.code].join("+")
}

export function formatShortcut(shortcut: string): string {
  const parts = shortcut
    .split("+")
    .map((p) => p.replace(/^(Key|Digit)/, ""))
    .map((p) => (MAC ? (MAC_GLYPHS[p] ?? p) : p))
  return MAC ? parts.join("") : parts.join("+")
}
