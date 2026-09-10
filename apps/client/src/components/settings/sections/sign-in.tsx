import { Button } from "@doska/ui-kit"
import { useState } from "react"
import { ssoLinkUrl } from "@doska/core/sso"
import { useLinkedProviders, useSsoProviders } from "@doska/core/queries"
import { useAuth } from "@/lib/hooks"
import { isDesktop } from "@/lib/platform"
import { SettingsSection } from "../section"

/**
 * Connects the signed-in account to an identity provider
 */
export function SignInSection() {
  const { userId } = useAuth()
  const { data: providers } = useSsoProviders()
  const { data: linked } = useLinkedProviders(userId)
  const [error, setError] = useState<string | null>(null)

  if (!userId || !providers?.length) return null

  async function connect(providerId: string) {
    setError(null)
    try {
      window.location.assign(
        await ssoLinkUrl(providerId, window.location.pathname)
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start connecting")
    }
  }

  if (isDesktop())
    return (
      <SettingsSection>
        <p className="text-xs text-muted-foreground">
          Connecting {providers.map((p) => p.name).join(", ")} sign-in is
          available in the web app.
        </p>
      </SettingsSection>
    )

  return (
    <SettingsSection>
      {providers.map((provider) => (
        <div key={provider.id} className="flex items-center gap-2 text-sm">
          <span>{provider.name}</span>
          {linked?.includes(provider.id) ? (
            <span className="ml-auto text-xs text-muted-foreground">
              Connected
            </span>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="ml-auto"
              onClick={() => connect(provider.id)}
            >
              Connect
            </Button>
          )}
        </div>
      ))}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </SettingsSection>
  )
}
