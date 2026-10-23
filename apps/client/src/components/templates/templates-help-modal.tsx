import type { ReactNode } from "react"
import { CardContent, Modal, ModalContent, ModalHeader } from "@doska/ui-kit"
import {
  CopyPlus,
  Folder,
  type LucideIcon,
  SquareText,
  Unlink,
} from "lucide-react"

interface Section {
  icon: LucideIcon
  text: ReactNode
}

const LABEL = "font-medium text-foreground"

const SECTIONS: Section[] = [
  {
    icon: SquareText,
    text: (
      <>
        Every card or board can be a template. Then they can be duplicated:
        cards through the button next to <span className={LABEL}>+</span> in
        any column, boards through <span className={LABEL}>New board</span> on
        this page.
      </>
    ),
  },
  {
    icon: Unlink,
    text: (
      <>
        Templates keep the reference to the board or card that has been marked
        as a template. These references can be deleted from this page.{" "}
        <span className={LABEL}>
          It does not delete the card or board, just the mark that it's a
          template.
        </span>
      </>
    ),
  },
  {
    icon: Folder,
    text: (
      <>
        To have better structure, it is recommended to create a dedicated folder
        for templates and store them there. They will be regular boards or
        regular cards, but it will be easier for you to keep them from
        accidental deletion.
      </>
    ),
  },
  {
    icon: CopyPlus,
    text: (
      <>
        Boards and cards are copied from templates as-is, except for assignees
        and attachments, which are left out.
      </>
    ),
  },
]

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplatesHelpModal({ open, onOpenChange }: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-md">
        <ModalHeader onClose={() => onOpenChange(false)}>
          How templates work
        </ModalHeader>
        <CardContent className="flex max-h-[70vh] flex-col overflow-y-auto p-4 text-sm">
          <ul className="flex flex-col gap-4">
            {SECTIONS.map((section, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
                  <section.icon className="size-4 text-muted-foreground" />
                </span>
                <p className="leading-relaxed text-muted-foreground">
                  {section.text}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
