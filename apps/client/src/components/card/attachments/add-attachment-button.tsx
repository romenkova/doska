import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@doska/ui-kit"
import { Paperclip } from "lucide-react"
import { useRef } from "react"
import { useUploads } from "./context/attachment-upload-context"

/**
 * Header control that uploads files to the card via the shared upload context.
 * Disabled with a hint when no sync backend is configured.
 */
export function AddAttachmentButton() {
  const { addFiles, busy, error, enabled, disabledReason } = useUploads()
  const inputRef = useRef<HTMLInputElement>(null)

  async function onFiles(files: FileList | null) {
    await addFiles(files)
    if (inputRef.current) inputRef.current.value = ""
  }

  const button = (
    <Button
      variant="ghost"
      size="sm"
      disabled={!enabled || busy}
      onClick={() => inputRef.current?.click()}
    >
      <Paperclip />
      {busy ? "Uploading…" : "Attach"}
    </Button>
  )

  const hint = !enabled ? disabledReason : (error ?? null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => void onFiles(e.target.files)}
      />
      {hint ? (
        <Tooltip>
          <TooltipTrigger render={button} />
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
    </>
  )
}
