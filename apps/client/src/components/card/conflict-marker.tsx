import { Tooltip, TooltipContent, TooltipTrigger } from "@doska/ui-kit"
import { TriangleAlert } from "lucide-react"

export function ConflictMarker() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            aria-label="Edit conflict"
            className="inline-flex text-amber-600 dark:text-amber-400"
          />
        }
      >
        <TriangleAlert className="size-4 md:size-3.5" />
      </TooltipTrigger>
      <TooltipContent>Edit conflict</TooltipContent>
    </Tooltip>
  )
}
