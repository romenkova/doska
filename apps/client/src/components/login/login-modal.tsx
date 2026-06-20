import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from "@deck/ui-kit"
import { useState } from "react"
import { useLogin } from "@/lib/data/mutations"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Sign-in dialog for the sync session.
 */
export function LoginModal({ open, onOpenChange }: IProps) {
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const { mutate, isPending, isError, reset } = useLogin()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    mutate(
      { login, password },
      {
        onSuccess: () => {
          setPassword("")
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <ModalContent className="md:max-w-sm">
        <form onSubmit={submit} className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <ModalTitle>Sign in to sync</ModalTitle>
            <ModalDescription>
              Your boards stay on this device until you sign in to sync them.
            </ModalDescription>
          </div>

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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !login || !password}>
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}
