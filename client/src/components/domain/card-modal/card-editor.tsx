import { ModalContent, Button } from "@/components/ui"
import { Markdown } from "@/components/domain"
import type { Card } from "@/lib/card-data"
import { cn } from "@/lib/utils"
import { Eye } from "lucide-react"
import { useState } from "react"
import { useToggle } from "@/lib/hooks/use-toggle"

const fieldClass =
  "w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground/50"

interface IProps {
  id: string
  content: Card
  onSave: (next: Card) => void
  onClose: () => void
}

export function CardEditor({ content, onSave, onClose }: IProps) {
  const [isPreview, togglePreview] = useToggle(false)
  const [draftTitle, setDraftTitle] = useState(content.title)
  const [draftBody, setDraftBody] = useState(content.body)

  const save = () => {
    onSave({ title: draftTitle, body: draftBody })
    onClose()
  }

  return (
    <ModalContent className="md:h-[85vh]">
      {/* native-style action bar: leading / title / trailing */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2">
        <div className="flex w-20 justify-start">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="sm" onClick={togglePreview}>
            <Eye />
            {isPreview ? "Back to edit" : "Preview"}
          </Button>
          <Button size="sm" onClick={save}>
            Save
          </Button>
        </div>
      </div>
      {isPreview ? (
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <input
            readOnly
            value={draftTitle}
            className={cn(fieldClass, "py-1.5 text-lg font-semibold")}
          />
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] select-text">
            {draftBody && <Markdown>{draftBody}</Markdown>}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <input
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Title"
            className={cn(
              fieldClass,
              "border-b-2 border-dashed py-1.5 font-mono text-lg font-semibold"
            )}
          />
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            placeholder="Notes"
            className={cn(
              fieldClass,
              "field-sizing-content min-h-[40vh] py-2 font-mono text-base leading-relaxed [font-variant-ligatures:none]"
            )}
          />
        </div>
      )}
    </ModalContent>
  )
}
