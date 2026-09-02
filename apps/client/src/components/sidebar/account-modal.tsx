import { useAccount } from "@doska/core/account"
import { useLogout } from "@doska/core/mutations"
import { apiUrlDomain } from "@doska/core/server"
import { initials } from "@doska/core/utils"
import {
  Avatar,
  AvatarFallback,
  Button,
  CardContent,
  cn,
  Modal,
  ModalContent,
  ModalHeader,
} from "@doska/ui-kit"
import { LogOut, UserRound } from "lucide-react"
import { AccountTag } from "@/components/accounts/account-tag"
import { SettingsSection } from "@/components/settings/section"
import { SignInSection } from "@/components/settings/sections/sign-in"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountModal({ open, onOpenChange }: IProps) {
  const { session, name, subtitle, dropped } = useAccount()
  const { mutate: logout } = useLogout()

  const login = session?.login ?? null

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-sm">
        <ModalHeader onClose={() => onOpenChange(false)}>Account</ModalHeader>
        <CardContent className="flex flex-col overflow-y-auto px-0">
          <SettingsSection>
            <div className="flex items-center gap-3">
              <Avatar className="size-12 rounded-full">
                <AvatarFallback className="rounded-full text-base">
                  {login ? initials(login) : <UserRound className="size-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-medium">{name}</span>
                  {session?.isAdmin && <AccountTag>Owner</AccountTag>}
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    dropped ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      dropped ? "bg-destructive" : "bg-emerald-500"
                    )}
                  />
                  {subtitle} to {apiUrlDomain()}
                </span>
              </div>
            </div>
          </SettingsSection>
          <SignInSection />
          <SettingsSection>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                logout()
                onOpenChange(false)
              }}
            >
              <LogOut />
              Sign out
            </Button>
          </SettingsSection>
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
