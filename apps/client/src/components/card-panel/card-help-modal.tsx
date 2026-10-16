import { CardContent, Modal, ModalContent, ModalHeader } from "@doska/ui-kit"
import {
  AppWindow,
  Ellipsis,
  type LucideIcon,
  NotebookPen,
  Paperclip,
  Pencil,
} from "lucide-react"
import { Fragment, type ReactNode } from "react"
import { isDesktop } from "@/lib/platform"
import { Kbd } from "./kbd"

const MOD = navigator.userAgent.includes("Mac") ? "⌘" : "Ctrl"

interface Shortcut {
  label: string
  keys: string[]
}

interface ShortcutSection {
  title: string
  items: Shortcut[]
}

interface Tip {
  icon: LucideIcon
  title: string
  text: ReactNode
  desktopOnly?: boolean
}

const SHORTCUTS: ShortcutSection[] = [
  {
    title: "Formatting",
    items: [
      { label: "Bold", keys: [MOD, "B"] },
      { label: "Italic", keys: [MOD, "I"] },
      { label: "Inline code", keys: [MOD, "E"] },
      { label: "Tick a task, or make the line one", keys: [MOD, "Enter"] },
      { label: "Indent", keys: ["Tab"] },
      { label: "Outdent", keys: ["Shift", "Tab"] },
    ],
  },
  {
    title: "Type to insert",
    items: [
      { label: "Command menu", keys: ["/"] },
      { label: "Link another card", keys: ["[["] },
      { label: "Tag", keys: ["#"] },
      { label: "Mention someone", keys: ["@"] },
      { label: "Highlight", keys: ["==text=="] },
      { label: "Cut the board preview here", keys: ["-cut-"] },
    ],
  },
  {
    title: "Anywhere",
    items: [
      { label: "Close the card", keys: ["Esc"] },
      { label: "Search", keys: [MOD, "K"] },
      { label: "Restore the last deleted item", keys: [MOD, "Z"] },
      { label: "Sync now", keys: [MOD, "S"] },
      { label: "Toggle the sidebar", keys: [MOD, "B"] },
    ],
  },
]

const TIPS: Tip[] = [
  {
    icon: Paperclip,
    title: "Files",
    text: (
      <>
        Drop them on the card, paste them, or use the paperclip up top. Not
        working?{" "}
        <a
          href="https://doska.sh/docs/user-guides/attachments"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline underline-offset-2"
        >
          Check the documentation
        </a>
        , you may need to set this up.
      </>
    ),
  },
  {
    icon: Pencil,
    title: "Editing",
    text: "Click the text to edit. The eye button switches back to preview.",
  },
  {
    icon: Ellipsis,
    title: "Card menu",
    text: "Deadline, priority, tags, assignees, column, history, reveal on board, delete.",
  },
  {
    icon: AppWindow,
    title: "Own window",
    text: "Drag the card's header out of the app, or pick it in the ⋯ menu.",
    desktopOnly: true,
  },
  {
    icon: NotebookPen,
    title: "Quick note",
    text: "Set a global shortcut in Settings to jot a card from anywhere.",
    desktopOnly: true,
  },
]

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CardHelpModal({ open, onOpenChange }: IProps) {
  const desktop = isDesktop()

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-md">
        <ModalHeader onClose={() => onOpenChange(false)}>
          Card shortcuts
        </ModalHeader>
        <CardContent className="flex max-h-[70vh] flex-col divide-y overflow-y-auto px-0 text-sm">
          {SHORTCUTS.map((section) => (
            <section key={section.title} className="flex flex-col gap-3 p-4">
              <h3 className="text-base font-medium">{section.title}</h3>
              <ul className="flex flex-col gap-1.5">
                {section.items.map((item) => (
                  <li
                    key={item.keys.join("+")}
                    className="flex items-center justify-between gap-4"
                  >
                    <span>{item.label}</span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      {item.keys.map((key, index) => (
                        <Fragment key={key}>
                          {index > 0 && "+"}
                          <Kbd>{key}</Kbd>
                        </Fragment>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <section className="flex flex-col gap-3 p-4">
            <h3 className="text-base font-medium">Tips</h3>
            <ul className="flex flex-col gap-4">
              {TIPS.filter((tip) => desktop || !tip.desktopOnly).map((tip) => (
                <li key={tip.title} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
                    <tip.icon className="size-4 text-muted-foreground" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">{tip.title}</span>
                    <span className="text-muted-foreground">{tip.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
