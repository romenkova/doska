import { useAccounts } from "@doska/core"
import { useAuth } from "@/lib/hooks"
import { AccountRow } from "./account-row"
import { CreateAccountForm } from "./create-account-form"

/**
 * Who can sign in to this server.
 */
export function AccountList() {
  const { userId, isAdmin } = useAuth()
  const { data: accounts, isPending, error } = useAccounts(isAdmin)

  return (
    <div className="flex flex-col gap-4">
      <CreateAccountForm />
      {isPending && (
        <p className="text-xs text-muted-foreground">Loading accounts…</p>
      )}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
      {accounts && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground">
            {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
          </div>
          <ul className="flex flex-col rounded-lg border border-border">
            {accounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                isSelf={account.id === userId}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
