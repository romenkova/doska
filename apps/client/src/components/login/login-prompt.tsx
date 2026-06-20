import { useMemo, useState } from "react"
import { LoginPromptContext } from "./login-prompt-context"
import { LoginModal } from "./login-modal"

/**
 * Owns the sign-in modal's open-state and mounts the modal once, so any
 * descendant (the sidebar account, the sync indicator) can prompt it via
 * useLoginPrompt
 */
export function LoginPromptProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const openPrompt = useMemo(() => () => setOpen(true), [])

  return (
    <LoginPromptContext.Provider value={openPrompt}>
      {children}
      <LoginModal open={open} onOpenChange={setOpen} />
    </LoginPromptContext.Provider>
  )
}
