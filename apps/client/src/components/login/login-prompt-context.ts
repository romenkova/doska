import { createContext, useContext } from "react"

/**
 * Shared state for the sign-in modal.
 */
export const LoginPromptContext = createContext<(() => void) | null>(null)

/** Returns a function that opens the sign-in modal. */
export function useLoginPrompt(): () => void {
  const open = useContext(LoginPromptContext)
  if (!open) {
    throw new Error("useLoginPrompt must be used within <LoginPromptProvider>")
  }
  return open
}
