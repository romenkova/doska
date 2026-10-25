import { SlidesModal } from "@doska/ui-kit"
import templates from "./slides/templates.md?raw"
import smallerThings from "./slides/smaller-things.md?raw"
import feedback from "./slides/feedback.md?raw"

const SLIDES = [templates, smallerThings, feedback]

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsNewModal({ open, onOpenChange }: IProps) {
  return <SlidesModal slides={SLIDES} open={open} onOpenChange={onOpenChange} />
}
