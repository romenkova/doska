import { Button, Input } from "@doska/ui-kit"
import { UserPlus } from "lucide-react"
import { useState } from "react"
import { useCreateAccount } from "@doska/core"

/** Adds an account: a login and its first password, nothing else. */
export function CreateAccountForm() {
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const { mutate, isPending, error, reset } = useCreateAccount()

  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    mutate(
      { login: login.trim(), password },
      {
        onSuccess: () => {
          setLogin("")
          setPassword("")
        },
      }
    )
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <UserPlus className="size-4 text-muted-foreground" />
        Add an account
      </div>
      <div className="flex items-center gap-2">
        <Input
          name="new-login"
          autoComplete="off"
          placeholder="Login"
          value={login}
          onChange={(e) => {
            setLogin(e.target.value)
            reset()
          }}
        />
        <Input
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          className="shrink-0"
          disabled={isPending || !login.trim() || !password}
        >
          {isPending ? "Adding…" : "Add"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </form>
  )
}
