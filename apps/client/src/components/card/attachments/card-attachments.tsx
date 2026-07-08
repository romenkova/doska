import { CardContent, cn, InvisibleInput } from "@doska/ui-kit"
import { Loader2, X } from "lucide-react"
import type { Attachment } from "@/lib/types"
import { useCard } from "@/lib/data/queries"
import { useUpdateCard } from "@/lib/data/mutations"
import { activeStorage } from "@/lib/api/attachments"
import { AttachmentTile } from "./attachment-tile"
import { useState } from "react"
import { usePendingUploads } from "./context/attachment-upload-context"

function splitName(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf(".")
  return dot >= 0
    ? { base: name.slice(0, dot), ext: name.slice(dot) }
    : { base: name, ext: "" }
}

interface IProps {
  cardId: string
  isReadonly: boolean
  className: string
}

export function CardAttachments({ cardId, isReadonly, className }: IProps) {
  const { data: card } = useCard(cardId)
  const { mutate: save } = useUpdateCard(cardId)

  const [error, setError] = useState("")
  const pending = usePendingUploads()

  const attachments = card?.attachments ?? []
  if (!attachments.length && !pending.length) return null

  const persist = (next: Attachment[]) => save({ attachments: next })

  const rename = (id: string, name: string) =>
    persist(attachments.map((a) => (a.id === id ? { ...a, name } : a)))

  async function remove(att: Attachment) {
    persist(attachments.filter((a) => a.id !== att.id))
    try {
      await activeStorage().remove(cardId, att.key)
    } catch {
      // Orphaned blob is harmless; the record is what the UI reads.
    }
  }

  async function open(att: Attachment) {
    try {
      const url = await activeStorage().url(cardId, att.key)
      window.open(url, "_blank", "noopener")
    } catch {
      setError("Could not open file")
    }
  }

  return (
    <CardContent className={className}>
      <div className="flex flex-col items-start">
        {attachments.map((att) => {
          const { base, ext } = splitName(att.name)
          return (
            <div
              key={att.id}
              className="group flex items-center gap-1 rounded-md py-0.5"
            >
              <div
                className={cn("flex flex-1 cursor-pointer items-center")}
                onClick={() => (isReadonly ? void open(att) : undefined)}
              >
                <AttachmentTile
                  cardId={cardId}
                  attachment={att}
                  className="size-6 shrink-0"
                  onOpen={() => void open(att)}
                />
                {isReadonly ? (
                  <span className="px-2 text-sm">{att.name}</span>
                ) : (
                  <>
                    <InvisibleInput
                      value={base}
                      onCommit={(next) => rename(att.id, next + ext)}
                      label="Attachment name"
                      placeholder="name"
                      title="Click to rename"
                      allowEmpty
                      className="ml-1 block shrink-0 text-sm"
                    />
                    {ext && (
                      <span className="shrink-0 text-sm text-muted-foreground">
                        {ext}
                      </span>
                    )}
                  </>
                )}
              </div>
              {error && (
                <div className="ml-2 text-sm text-destructive">{error}</div>
              )}
              {!isReadonly && (
                <button
                  type="button"
                  aria-label="Remove attachment"
                  onClick={() => void remove(att)}
                  className={cn(
                    "ml-2 shrink-0 rounded p-1 text-muted-foreground opacity-0",
                    "group-hover:opacity-100 hover:text-destructive"
                  )}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )
        })}
        {pending.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-1 rounded-md py-0.5 opacity-60"
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-sm border">
              <Loader2 className="size-3 animate-spin text-muted-foreground" />
            </div>
            <span className="ml-1 truncate text-sm text-muted-foreground">
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </CardContent>
  )
}
