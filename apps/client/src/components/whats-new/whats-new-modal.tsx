import { SlidesModal } from "@doska/ui-kit"
import tags from "./slides/tags.md?raw"
import smallerThings from "./slides/smaller-things.md?raw"
import feedback from "./slides/feedback.md?raw"

const SLIDES = [tags, smallerThings, feedback]

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsNewModal({ open, onOpenChange }: IProps) {
  return <SlidesModal slides={SLIDES} open={open} onOpenChange={onOpenChange} />
}
