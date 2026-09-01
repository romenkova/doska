import { Avatar, AvatarFallback, Button, cn } from "@doska/ui-kit"
import { initials } from "@doska/core/utils"
import { useState } from "react"
import { useSetAccountActive } from "@doska/core/mutations"
import type { Account } from "@doska/core/queries"
import { AccountTag } from "./account-tag"
import { DeleteAccountModal } from "./delete-account-modal"
import { ResetPasswordForm } from "./reset-password-form"

interface IProps {
  account: Account
  isSelf: boolean
}

export function AccountRow({ account, isSelf }: IProps) {
  const [resetting, setResetting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const setActive = useSetAccountActive()

  const canDelete = !isSelf && !account.active

  return (
    <li className="flex flex-col gap-2 border-b border-border p-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <Avatar className={cn("size-8", !account.active && "opacity-50")}>
          <AvatarFallback className="text-xs">
            {initials(account.login)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{account.login}</span>
          <div className="flex items-center gap-1">
            {account.isAdmin && <AccountTag>Owner</AccountTag>}
            {account.sso && <AccountTag>SSO</AccountTag>}
            {isSelf && <AccountTag>You</AccountTag>}
            {!account.active && <AccountTag>Inactive</AccountTag>}
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => setResetting((open) => !open)}
          >
            {resetting ? "Cancel" : "Change password"}
          </Button>
          {!isSelf && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={setActive.isPending}
              onClick={() =>
                setActive.mutate({ id: account.id, active: !account.active })
              }
            >
              {account.active ? "Deactivate" : "Activate"}
            </Button>
          )}
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => setDeleting(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
      {setActive.error && (
        <p className="text-xs text-destructive">{setActive.error.message}</p>
      )}
      {resetting && (
        <ResetPasswordForm id={account.id} onDone={() => setResetting(false)} />
      )}
      {deleting && (
        <DeleteAccountModal
          account={account}
          open={deleting}
          onOpenChange={setDeleting}
        />
      )}
    </li>
  )
}
