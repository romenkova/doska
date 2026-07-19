import type { ReactNode } from "react"
import ReactMarkdown, { defaultUrlTransform } from "react-markdown"
import remarkGfm from "remark-gfm"
import { remarkMark } from "remark-mark-highlight"
import { Checkbox, cn } from "@doska/ui-kit"
import { remarkCut } from "./plugins/remark-cut"
import { remarkTags } from "./plugins/remark-tags"
import { rehypeTaskIndex } from "./plugins/rehype-task-index"
import { attachmentKeyFromSrc } from "./attachment-src"
import "./markdown.css"

// react-markdown's default transform blanks unknown URL schemes; let our
// `attachment:` refs through so the img renderer can resolve them.
function urlTransform(url: string): string {
  return attachmentKeyFromSrc(url) !== null ? url : defaultUrlTransform(url)
}

interface IProps {
  children: string
  className?: string
  /**
   * When provided, task-list checkboxes become interactive; clicking one calls
   * back with its 0-based index in document order (matching `taskProgress` /
   * `toggleTaskByIndex`). Without it, checkboxes render read-only as before.
   */
  onToggleTask?: (index: number) => void
  /** Renders `attachment:<key>` image refs (async client-side URL lookup). */
  renderImage?: (attachmentKey: string, alt: string) => ReactNode
}

export function Markdown({
  children,
  className,
  onToggleTask,
  renderImage,
}: IProps) {
  return (
    <div className={cn("markdown", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMark, remarkCut, remarkTags]}
        rehypePlugins={[rehypeTaskIndex]}
        urlTransform={urlTransform}
        components={{
          a: (props) => (
            <a
              {...props}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          img: ({ src, alt, ...props }) => {
            const key = attachmentKeyFromSrc(src)
            if (key !== null && renderImage) return renderImage(key, alt ?? "")
            return <img {...props} src={src} loading="lazy" alt={alt ?? ""} />
          },
          input: ({ node, ...props }) => {
            if (props.type !== "checkbox")
              return <input aria-label="Checkbox" {...props} />
            // `rehypeTaskIndex` tags each checkbox with its task index.
            const raw = node?.properties?.dataTaskIndex
            const index = typeof raw === "number" ? raw : undefined
            const interactive = index != null && !!onToggleTask

            return (
              <span className="contents" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  aria-label="Checkbox"
                  checked={!!props.checked}
                  readOnly={!interactive}
                  className={cn(
                    "mr-1.5 -mt-0.5 inline-flex align-middle",
                    interactive && "cursor-pointer"
                  )}
                  onCheckedChange={
                    interactive ? () => onToggleTask(index) : undefined
                  }
                />
              </span>
            )
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
