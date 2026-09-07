import { invoke } from "@tauri-apps/api/core"

export type ShortcutName = "quick-note"

export const getShortcut = (name: ShortcutName) =>
  invoke<string>("get_shortcut", { name })

export const suspendShortcut = (name: ShortcutName) =>
  invoke("suspend_shortcut", { name })

export const setShortcut = (name: ShortcutName, shortcut: string) =>
  invoke("set_shortcut", { name, shortcut })
