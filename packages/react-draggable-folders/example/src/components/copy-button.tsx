import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { IconButton } from "./icon-button"

interface IProps {
  text: string
}

export function CopyButton({ text }: IProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <IconButton label="Copy" onClick={copy}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </IconButton>
  )
}
