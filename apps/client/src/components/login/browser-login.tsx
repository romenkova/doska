import { Button, Input } from "@doska/ui-kit"
import { useState } from "react"
import {
  desktopLoginToken,
  startDesktopLogin,
  type DesktopLogin,
} from "@doska/core/desktop-login"
import { useLogin } from "@doska/core/mutations"
import { getServerUrl, setServerUrl } from "@doska/core/server"

interface IProps {
  onDone: () => void
}

/**
 * Desktop sign-in: pick the server, then sign in through the system browser
 */
export function BrowserLogin({ onDone }: IProps) {
  const [server, setServer] = useState(() => getServerUrl())
  const [attempt, setAttempt] = useState<DesktopLogin | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { mutate, isPending } = useLogin()

  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    try {
      if (!attempt) {
        setServerUrl(server)
        const started = await startDesktopLogin()
        const { openUrl } = await import("@tauri-apps/plugin-opener")
        await openUrl(started.url)
        setAttempt(started)
        return
      }
      const token = await desktopLoginToken(attempt)
      if (!token) {
        setError("Finish signing in in the browser first.")
        return
      }
      mutate(
        { token },
        { onSuccess: onDone, onError: (e) => setError(e.message) }
      )
    } catch (e) {
      setAttempt(null)
      setError(e instanceof Error ? e.message : "Sign-in failed")
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {attempt ? (
          <p className="text-sm text-muted-foreground">
            Finish signing in in the browser, then come back.
          </p>
        ) : (
          <Input
            autoFocus
            name="server"
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="Server URL (https://…)"
            value={server}
            onChange={(e) => setServer(e.target.value)}
          />
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !server.trim()}>
          {isPending
            ? "Signing in..."
            : attempt
              ? "I've signed in"
              : "Sign in in browser"}
        </Button>
      </div>
    </form>
  )
}
