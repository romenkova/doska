import { cn } from "./lib/cn"
import { useLayoutEffect, useRef } from "react"

interface IProps {
  value: string
  onChangeValue: (value: string) => void
  isPreview: boolean
  autoFocus?: boolean
}

export function TitleEditor({
  value,
  onChangeValue,
  isPreview,
  autoFocus,
}: IProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [value, isPreview])

  if (isPreview)
    return (
      <div className="py-1.5 pt-3 text-2xl font-bold whitespace-pre-wrap select-text">
        {value}
      </div>
    )

  return (
    <textarea
      ref={ref}
      autoFocus={autoFocus}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      rows={1}
      value={value}
      onChange={(e) => onChangeValue(e.target.value)}
      placeholder="Title"
      className={cn(
        "w-full resize-none overflow-hidden bg-transparent outline-none",
        "py-1.5 font-mono text-xl leading-relaxed font-semibold",
        "placeholder:text-muted-foreground/50"
      )}
    />
  )
}
