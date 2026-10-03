import { useState } from "react"
import { Button, cn } from "@doska/ui-kit"
import { Check, Copy, Globe } from "lucide-react"
import {
  useBoardMembers,
  usePublicBoardStatus,
  usePublishBoard,
  useUnpublishBoard,
  apiUrl,
} from "@doska/core"
import { routes } from "@/lib/routes"

interface IProps {
  boardId: string
}

/**
 * Publishes a board to a link anyone can open, and takes it back.
 */
export function PublicLink({ boardId }: IProps) {
  const { data: roster } = useBoardMembers(boardId, true)
  const { data, isPending } = usePublicBoardStatus(boardId, true)
  const { mutate: publish, isPending: isPublishing } = usePublishBoard(boardId)
  const { mutate: unpublish, isPending: isUnpublishing } =
    useUnpublishBoard(boardId)
  const [copied, setCopied] = useState(false)

  const isOwner = roster?.viewerRole === "owner"
  const token = data ?? null

  const url = token ? apiUrl(routes.public.to(token)) : ""
  const busy = isPending || isPublishing || isUnpublishing

  function copy() {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!isOwner && !token) return null

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-start gap-3">
        <Globe className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="font-medium">Anyone with the link</div>
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? "Read-only, and no account needed. Turning it off breaks the existing link for good."
              : "This board is published: anyone with the link can read it, with no account. Only its owner can turn that off."}
          </p>
        </div>
        {isOwner &&
          (token ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => unpublish()}
            >
              Turn off
            </Button>
          ) : (
            <Button size="sm" disabled={busy} onClick={() => publish()}>
              Create link
            </Button>
          ))}
      </div>

      {token && (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={url}
            aria-label="Public link"
            onFocus={(e) => e.currentTarget.select()}
            className={cn(
              "min-w-0 flex-1 rounded-md border bg-muted/40 px-2 py-1.5",
              "font-mono text-xs text-muted-foreground outline-none"
            )}
          />
          <Button variant="ghost" size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
    </div>
  )
}
