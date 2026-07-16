const AUTO_UPDATE_KEY = "deck:auto-update"

const listeners = new Set<() => void>()

export function subscribeAutoUpdate(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Defaults to off so a self-hosted setup is never updated ahead of its server.
export function getAutoUpdate(): boolean {
  return localStorage.getItem(AUTO_UPDATE_KEY) === "true"
}

export function setAutoUpdate(on: boolean): void {
  localStorage.setItem(AUTO_UPDATE_KEY, on ? "true" : "false")
  for (const listener of listeners) listener()
}
