import {
  Button,
  cn,
  Input,
  InvisibleInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@doska/ui-kit"
import { Plus, X } from "lucide-react"
import { useRef, useState } from "react"
import type { Attachment } from "@/lib/types"
import { useCard } from "@/lib/data/queries"
import { useUpdateCard } from "@/lib/data/mutations"
import { activeStorage } from "@/lib/api/attachments"
import { isSyncConfigured } from "@/lib/api/runtime"
import { AttachmentRow } from "./attachment-row"

function splitName(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf(".")
  return dot >= 0
    ? { base: name.slice(0, dot), ext: name.slice(dot) }
    : { base: name, ext: "" }
}

export function CardAttachments({ cardId }: { cardId: string }) {
  const { data: card } = useCard(cardId)
  const { mutate: save } = useUpdateCard(cardId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const attachments = card?.attachments ?? []
  const enabled = isSyncConfigured()

  const persist = (next: Attachment[]) => save({ attachments: next })

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    setError(null)
    try {
      const storage = activeStorage()
      const added: Attachment[] = []
      for (const file of Array.from(files)) {
        const stored = await storage.put(cardId, {
          name: file.name,
          mime: file.type || "application/octet-stream",
          bytes: file,
        })
        added.push({
          id: crypto.randomUUID(),
          name: file.name,
          key: stored.key,
          mime: stored.mime,
          size: stored.size,
        })
      }
      persist([...attachments, ...added])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function rename(id: string, name: string) {
    persist(attachments.map((a) => (a.id === id ? { ...a, name } : a)))
  }

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

  const addButton = (
    <Button
      disabled={!enabled || busy}
      onClick={() => inputRef.current?.click()}
      variant="ghost"
    >
      <Plus className="size-4" />
      <span>{busy ? "Uploading…" : "Add file"}</span>
    </Button>
  )

  return (
    <div className="mt-4 flex flex-col items-start gap-1.5">
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => void onFiles(e.target.files)}
      />
      {attachments.map((att) => (
        <div
          key={att.id}
          className="group flex items-center gap-2 rounded-md py-0.5"
        >
          {(() => {
            const { base, ext } = splitName(att.name)
            return (
              <div className="flex flex-1 items-center gap-1">
                <InvisibleInput
                  value={base}
                  onChange={(e) => rename(att.id, e.target.value + ext)}
                  className="h-8 min-w-0 flex-1 text-sm"
                />
                {ext && (
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {ext}
                  </span>
                )}
              </div>
            )
          })()}
          <button
            type="button"
            aria-label="Remove attachment"
            onClick={() => void remove(att)}
            className={cn(
              "shrink-0 rounded p-1 text-muted-foreground opacity-0",
              "group-hover:opacity-100 hover:text-destructive"
            )}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      {enabled ? (
        addButton
      ) : (
        <Tooltip>
          <TooltipTrigger render={addButton} />
          <TooltipContent>
            Connect a sync backend to attach files
          </TooltipContent>
        </Tooltip>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
