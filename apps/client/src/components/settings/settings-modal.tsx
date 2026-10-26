import { CardContent, Modal, ModalContent, ModalHeader } from "@doska/ui-kit"
import { BookOpen, Bot, Users } from "lucide-react"
import { FaGithub } from "react-icons/fa"
import { useAuth } from "@/lib/hooks"
import { isDesktop } from "@/lib/platform"
import { SettingsSection } from "./section"
import { SettingsRow } from "./settings-row"
import { CardViewSection } from "./sections/card-view"
import { QuickNoteSection } from "./sections/quick-note"
import { UpdatesSection } from "./sections/updates"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenAccounts: () => void
  onOpenLocalMcp: () => void
}

export function SettingsModal({
  open,
  onOpenChange,
  onOpenAccounts,
  onOpenLocalMcp,
}: IProps) {
  const { isAdmin } = useAuth()

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-sm">
        <ModalHeader onClose={() => onOpenChange(false)}>Settings</ModalHeader>
        <CardContent className="flex flex-col overflow-y-auto px-0">
          <UpdatesSection />
          <CardViewSection />
          <QuickNoteSection />
          <SettingsSection>
            <div className="flex flex-col">
              {isAdmin && (
                <SettingsRow
                  icon={<Users className="size-4" />}
                  label="Accounts"
                  onClick={onOpenAccounts}
                />
              )}
              {isDesktop() && (
                <SettingsRow
                  icon={<Bot className="size-4" />}
                  label="Local MCP"
                  onClick={onOpenLocalMcp}
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
