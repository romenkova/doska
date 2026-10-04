import { useState } from "react"

// Stores the hidden ones, so a newly created board shows up by default.
const HIDDEN_KEY = "doska:digest-hidden-boards"

function readHidden(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]")
  } catch {
    return []
  }
}

export function useHiddenBoards() {
  const [hidden, setHidden] = useState(readHidden)

  function toggleBoard(id: string) {
    const next = hidden.includes(id)
      ? hidden.filter((h) => h !== id)
      : [...hidden, id]
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(next))
    setHidden(next)
  }

  return { hidden, toggleBoard }
}
