import { SlidesModal } from "@doska/ui-kit"
import history from "./slides/history.md?raw"
import cardModal from "./slides/card-modal.md?raw"
import formatting from "./slides/formatting.md?raw"
import feedback from "./slides/feedback.md?raw"

const SLIDES = [history, cardModal, formatting, feedback]

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsNewModal({ open, onOpenChange }: IProps) {
  return <SlidesModal slides={SLIDES} open={open} onOpenChange={onOpenChange} />
}
