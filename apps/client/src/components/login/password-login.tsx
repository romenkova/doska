import { Button, Input } from "@doska/ui-kit"
import { useState } from "react"
import { useLogin } from "@doska/core"
import { SsoButtons } from "./sso-buttons"

interface IProps {
  onDone: () => void
  onCancel?: () => void
}

export function PasswordLogin({ onDone, onCancel }: IProps) {
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
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              reset()
              onCancel()
            }}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending || !login || !password}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </form>
  )
}
