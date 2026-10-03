import {
  Button,
  CardContent,
  Modal,
  ModalContent,
  ModalHeader,
} from "@doska/ui-kit"
import { useDeleteAccount, useOwnedBoards, type Account } from "@doska/core"

interface IProps {
  account: Account
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Deleting is refused server-side while the account owns a board, so the modal
 * asks first: either it explains how to empty the account, or it confirms.
 */
export function DeleteAccountModal({ account, open, onOpenChange }: IProps) {
  const owned = useOwnedBoards(account.id, open)
  const remove = useDeleteAccount()

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-md">
        <ModalHeader onClose={() => onOpenChange(false)}>
          Delete {account.login}
        </ModalHeader>
        <CardContent className="flex flex-col gap-4 py-4">
          {owned.isPending && (
            <p className="text-sm text-muted-foreground">
              Checking what this account still holds…
            </p>
          )}
          {owned.error && (
            <p className="text-sm text-destructive">{owned.error.message}</p>
          )}
          {owned.data !== undefined &&
            (owned.data > 0 ? (
              <OwnsBoards login={account.login} boards={owned.data} />
            ) : (
              <p className="text-sm">
                This account owns no boards. Deleting it is permanent: it can
                never sign in again.
              </p>
            ))}
          {remove.error && (
            <p className="text-sm text-destructive">{remove.error.message}</p>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={remove.isPending || owned.data !== 0}
              onClick={() =>
                remove.mutate(account.id, {
                  onSuccess: () => onOpenChange(false),
                })
              }
            >
              Delete account
            </Button>
          </div>
        </CardContent>
      </ModalContent>
    </Modal>
  )
}

/** There is no transferring a board, so emptying the account means signing in as it. */
function OwnsBoards({ login, boards }: { login: string; boards: number }) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p>
        {login} still owns {boards} {boards === 1 ? "board" : "boards"}. Boards
        belong to the account that made them, so they have to go before it does.
      </p>
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-muted-foreground">
        <li>Activate it and change its password, so you can sign in as it.</li>
        <li>Sign out, and sign back in as {login}.</li>
        <li>Delete its boards.</li>
        <li>Sign back in as yourself, deactivate it again, and delete it.</li>
      </ol>
    </div>
  )
}
