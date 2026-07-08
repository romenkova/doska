import { cn } from "@doska/ui-kit"
import { Upload, TriangleAlert } from "lucide-react"
import { useRef, useState, type ReactNode } from "react"
import { useUploads } from "./context/attachment-upload-context"

/** True when a drag carries files (not text or an internal element drag). */
function hasFiles(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes("Files")
}

/**
 * Wraps the card body so dropping files anywhere over it uploads them as
 * attachments. Shows an overlay while a file drag is over the area. When no sync
 * backend is configured, a drop still surfaces an error rather than silently
 * doing nothing.
 */
export function AttachmentDropZone({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const { addFiles, enabled, error, clearError } = useUploads()
  const [dragging, setDragging] = useState(false)
  // dragenter/leave fire per descendant; count depth so leaving a child doesn't
  // dismiss the overlay while still inside the zone.
  const depth = useRef(0)

  return (
    <div
      className={cn("relative", className)}
      onDragEnter={(e) => {
        if (!hasFiles(e)) return
        e.preventDefault()
        depth.current += 1
        setDragging(true)
        clearError()
      }}
      onDragOver={(e) => {
        if (hasFiles(e)) e.preventDefault()
      }}
      onDragLeave={() => {
        depth.current -= 1
        if (depth.current <= 0) {
          depth.current = 0
          setDragging(false)
        }
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return
        e.preventDefault()
        depth.current = 0
        setDragging(false)
        void addFiles(e.dataTransfer.files)
      }}
    >
      {children}
      {dragging && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10",
            "flex items-center justify-center rounded-lg",
            "bg-background/80 backdrop-blur-xs"
          )}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="size-6" />
            <span className="text-sm font-medium">
              {enabled ? "Drop files to attach" : "Attachments unavailable"}
            </span>
          </div>
        </div>
      )}
      {!dragging && error && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-2">
          <div className="flex items-center gap-1.5 rounded-md bg-destructive px-2.5 py-1 text-sm text-destructive-foreground shadow">
            <TriangleAlert className="size-4" />
            {error}
          </div>
        </div>
      )}
    </div>
  )
}
