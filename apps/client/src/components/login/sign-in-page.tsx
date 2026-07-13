import { Button, Input } from "@doska/ui-kit"
import { useState } from "react"
import { useSearch } from "wouter"
import { authClient } from "@/lib/api/auth-client"
import { apiUrl } from "@/lib/api/runtime"

/**
 * The standalone sign-in page, and the server's `mcp({ loginPage: "/sign-in" })`.
 * When an MCP client starts an OAuth flow against a browser with no session, the
 * plugin parks the authorization request in a cookie and sends the browser here
 * with the original query string. Signing in resumes it: we replay the request
 * against the authorize endpoint, which now sees a session and redirects on to
 * the MCP client.
 */
export function SignInPage() {
  const search = useSearch()
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const pendingOAuth = new URLSearchParams(search).has("client_id")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setFailed(false)

    // The plugin answers this very POST with a 302 into the pending OAuth flow
    // (it hooks any response that sets a session cookie), so the response is not
    // a reliable signal here: `manual` stops `fetch` from chasing that redirect
    // cross-origin, and the session check below is what says whether we're in.
    try {
      await authClient().signIn.username(
        { username: login, password },
        { redirect: "manual" }
      )
    } catch {
      // fall through to the session check
    }

    const { data } = await authClient().getSession()
    if (!data) {
      setPending(false)
      setFailed(true)
      return
    }

    // A full navigation, not a client-side route: the authorize endpoint answers
    // with a redirect to the MCP client, and only the browser can follow it.
    window.location.assign(
      pendingOAuth ? `${apiUrl("/api/auth/mcp/authorize")}?${search}` : "/"
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-medium">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            {pendingOAuth
              ? "An app is asking to connect to your boards."
              : "Sign in to sync your boards."}
          </p>
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
          {failed && (
            <p className="text-xs text-destructive">Invalid credentials.</p>
          )}
        </div>

        <Button type="submit" disabled={pending || !login || !password}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  )
}
