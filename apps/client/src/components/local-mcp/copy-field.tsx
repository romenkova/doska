import { useState } from "react"
import { Button, cn } from "@doska/ui-kit"
import { Check, Copy } from "lucide-react"

interface IProps {
  label: string
  value: string
  display?: string
}

export function CopyField({ label, value, display }: IProps) {
  const [copied, setCopied] = useState(false)

  function copy() {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={display ?? value}
        aria-label={label}
        onFocus={(e) => e.currentTarget.select()}
        className={cn(
          "min-w-0 flex-1 rounded-md border bg-muted/40 px-2 py-1.5",
          "font-mono text-xs text-muted-foreground outline-none"
        )}
      />
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Copy ${label}`}
        onClick={copy}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  )
}
