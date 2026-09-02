import { Button, Input, Modal, ModalContent, ModalTitle } from "@doska/ui-kit"
import { useState } from "react"
import { useLogin } from "@doska/core/mutations"
import {
  UNCLAIMED_BOARDS_WARNING,
  useUnclaimedLocalBoards,
} from "@doska/core/queries"
import { isDesktop } from "@/lib/platform"
import { BrowserLogin } from "./browser-login"
import { SsoButtons } from "./sso-buttons"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Set-up-sync dialog.
 */
export function LoginModal({ open, onOpenChange }: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-sm">
        {/* Keyed on `open` so the form state resets each time it's opened. */}
        <SyncSetup key={String(open)} onDone={() => onOpenChange(false)} />
      </ModalContent>
    </Modal>
  )
}

function SyncSetup({ onDone }: { onDone: () => void }) {
  const { data: unclaimedBoards } = useUnclaimedLocalBoards()

  return (
    <div className="flex flex-col gap-4 p-6">
      <ModalTitle>Sign in</ModalTitle>

      {unclaimedBoards && (
        <p className="text-muted-foreground">{UNCLAIMED_BOARDS_WARNING}</p>
      )}

      {isDesktop() ? (
        <BrowserLogin onDone={onDone} />
      ) : (
        <PasswordLogin onDone={onDone} />
      )}
    </div>
  )
}

function PasswordLogin({ onDone }: { onDone: () => void }) {
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const { mutate, isPending, isError, reset } = useLogin()

  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    mutate(
      { login, password },
      {
        onSuccess: () => {
          setPassword("")
          onDone()
        },
      }
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <SsoButtons callbackURL={window.location.pathname} />

      <div className="flex flex-col gap-2">
        <Input
          autoFocus
          name="login"
          autoComplete="username"
          placeholder="Login"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
        />
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {isError && (
          <p className="text-xs text-destructive">Invalid credentials.</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            reset()
            onDone()
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !login || !password}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </form>
  )
}
