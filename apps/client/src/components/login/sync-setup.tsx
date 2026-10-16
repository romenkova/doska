import { UNCLAIMED_BOARDS_WARNING, useUnclaimedLocalBoards } from "@doska/core"
import { isDesktop } from "@/lib/platform"
import { BrowserLogin } from "./browser-login"
import { PasswordLogin } from "./password-login"

interface IProps {
  onDone: () => void
  onCancel?: () => void
}

export function SyncSetup({ onDone, onCancel }: IProps) {
  const { data: unclaimedBoards } = useUnclaimedLocalBoards()

  return (
    <div className="flex flex-col gap-4">
      {unclaimedBoards && (
        <p className="text-muted-foreground">{UNCLAIMED_BOARDS_WARNING}</p>
      )}

      {isDesktop() ? (
        <BrowserLogin onDone={onDone} onCancel={onCancel} />
      ) : (
        <PasswordLogin onDone={onDone} onCancel={onCancel} />
      )}
    </div>
  )
}
