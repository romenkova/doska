import { Button } from "./button"
import { cn } from "./lib/cn"
import { Markdown } from "./markdown"
import { Modal, ModalContent, ModalHeader } from "./modal"
import { useRef, useState, type ReactNode } from "react"

/** A string renders as markdown; a function gets `next` to advance on its own. */
export type Slide = ReactNode | ((next: () => void) => ReactNode)

interface IProps {
  slides: Slide[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SlidesModal({ slides, open, onOpenChange }: IProps) {
  const [index, setIndex] = useState(0)
  const nextRef = useRef<HTMLButtonElement>(null)
  const isFirst = index === 0
  const isLast = index === slides.length - 1
  const slide = slides[index]

  function close() {
    onOpenChange(false)
    setIndex(0)
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <ModalContent className="md:max-w-lg" initialFocus={nextRef}>
        <ModalHeader onClose={close} />
        <div className="min-h-64 flex-1 overflow-y-auto px-6 pb-2">
          {typeof slide === "string" ? (
            <Markdown>{slide}</Markdown>
          ) : typeof slide === "function" ? (
            slide(() => setIndex(index + 1))
          ) : (
            slide
          )}
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <div className="flex items-center gap-1.5 pl-3">
            {slides.map((_, dot) => (
              <button
                key={dot}
                type="button"
                aria-label={`Slide ${dot + 1}`}
                onClick={() => setIndex(dot)}
                className={cn(
                  "size-1.5 rounded-full bg-muted-foreground/30 transition-colors",
                  dot === index && "bg-foreground"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4">
            {!isFirst && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIndex(index - 1)}
              >
                Back
              </Button>
            )}
            <Button
              ref={nextRef}
              type="button"
              size="sm"
              onClick={() => (isLast ? close() : setIndex(index + 1))}
            >
              {isLast ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
