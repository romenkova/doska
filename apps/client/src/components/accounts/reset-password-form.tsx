import { Button, Input } from "@doska/ui-kit"
import { useState } from "react"
import { useSetAccountPassword } from "@doska/core"

interface IProps {
  id: string
  onDone: () => void
}

/** Sets one account's password to whatever the owner types. */
export function ResetPasswordForm({ id, onDone }: IProps) {
  const [password, setPassword] = useState("")
  const { mutate, isPending, error } = useSetAccountPassword()

  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    mutate({ id, password }, { onSuccess: onDone })
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-1 rounded-md bg-muted/40 p-2"
    >
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          type="password"
          autoComplete="new-password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={isPending || !password}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </form>
  )
}
