import { useEffect, useState } from "react"
import { completeDesktopLogin } from "@doska/core/desktop-login"

/** Hands this browser's session to the desktop app that asked for it. */
export function DesktopHandoff({ id }: { id: string }) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    completeDesktopLogin(id).then(
      () => setDone(true),
      (e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not finish signing in")
    )
  }, [id])

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-1">
        <h1 className="text-lg font-medium">
          {done ? "You're in" : error ? "Sign-in failed" : "Signing in..."}
        </h1>
        <p className="text-sm text-muted-foreground">
          {done
            ? "Go back to Doska. You can close this tab."
            : (error ?? "Handing your session to the desktop app.")}
        </p>
      </div>
    </div>
  )
}
