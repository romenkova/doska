import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from "@doska/ui-kit"
import { useState } from "react"
import { useLogin } from "@/lib/data/mutations"
import { getServerUrl, setServerUrl } from "@/lib/api/server"
import { isDesktop } from "@/lib/platform"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Set-up-sync dialog: sign in to a remote sync server. Desktop has no
 * same-origin server, so it also asks for the server URL.
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
  const [server, setServer] = useState(() => getServerUrl())
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const { mutate, isPending, isError, reset } = useLogin()

  const desktop = isDesktop()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    // No same-origin server on desktop — persist the URL before signing in so
    // the auth and sync calls know where to go.
    if (desktop) setServerUrl(server)
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
    <form onSubmit={submit} className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <ModalTitle>Set up sync</ModalTitle>
        <ModalDescription>
          Your boards stay on this device until you set up sync.
        </ModalDescription>
      </div>

      <div className="flex flex-col gap-2">
        {desktop && (
          <Input
            name="server"
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="Server URL (https://…)"
            value={server}
            onChange={(e) => setServer(e.target.value)}
          />
        )}
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
        <Button
          type="submit"
          disabled={
            isPending || !login || !password || (desktop && !server.trim())
          }
        >
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </form>
  )
}
