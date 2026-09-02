import { CardContent, Modal, ModalContent, ModalHeader } from "@doska/ui-kit"
import { BookOpen, Users } from "lucide-react"
import { FaGithub } from "react-icons/fa"
import { useAuth } from "@/lib/hooks"
import { SettingsSection } from "./section"
import { SettingsRow } from "./settings-row"
import { UpdatesSection } from "./sections/updates"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenAccounts: () => void
}

export function SettingsModal({ open, onOpenChange, onOpenAccounts }: IProps) {
  const { isAdmin } = useAuth()

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-sm">
        <ModalHeader onClose={() => onOpenChange(false)}>Settings</ModalHeader>
        <CardContent className="flex flex-col overflow-y-auto px-0">
          <UpdatesSection />
          <SettingsSection>
            <div className="flex flex-col">
              {isAdmin && (
                <SettingsRow
                  icon={<Users className="size-4" />}
                  label="Accounts"
                  onClick={onOpenAccounts}
                />
              )}
              <SettingsRow
                icon={<BookOpen className="size-4" />}
                label="Docs"
                href="https://doska.sh/docs"
              />
              <SettingsRow
                icon={<FaGithub className="size-4" />}
                label="GitHub"
                href="https://github.com/romenkova/doska"
              />
            </div>
          </SettingsSection>
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
