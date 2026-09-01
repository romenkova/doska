import { Button } from "@doska/ui-kit"
import { useState } from "react"
import { ssoSignInUrl } from "@doska/core/sso"
import { useSsoProviders } from "@doska/core/queries"

interface IProps {
  /** Where the provider sends the browser back to, signed in. */
  callbackURL: string
}

/** One button per identity provider the server offers; nothing when it offers none. */
export function SsoButtons({ callbackURL }: IProps) {
  const { data: providers } = useSsoProviders()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!providers?.length) return null

  async function start(providerId: string) {
    setPending(true)
    setError(null)
    try {
      window.location.assign(await ssoSignInUrl(providerId, callbackURL))
    } catch (e) {
      setPending(false)
      setError(e instanceof Error ? e.message : "Could not start sign-in")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => start(provider.id)}
        >
          Continue with {provider.name}
        </Button>
      ))}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="text-center text-xs text-muted-foreground">or</div>
    </div>
  )
}
