import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { remarkMark } from "remark-mark-highlight"
import { cn } from "@doska/ui-kit"
import { remarkCut } from "./plugins/remark-cut"
import { remarkTags } from "./plugins/remark-tags"
import { rehypeTaskIndex } from "./plugins/rehype-task-index"
import "./markdown.css"

interface IProps {
  children: string
  className?: string
  /**
   * When provided, task-list checkboxes become interactive; clicking one calls
   * back with its 0-based index in document order (matching `taskProgress` /
   * `toggleTaskByIndex`). Without it, checkboxes render read-only as before.
   */
  onToggleTask?: (index: number) => void
}

export function Markdown({ children, className, onToggleTask }: IProps) {
  return (
    <div className={cn("markdown", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMark, remarkCut, remarkTags]}
        rehypePlugins={[rehypeTaskIndex]}
        components={{
          a: (props) => (
            <a
              {...props}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          input: ({ node, ...props }) => {
            // `rehypeTaskIndex` tags each checkbox with its task index.
            const raw = node?.properties?.dataTaskIndex
            const index = typeof raw === "number" ? raw : undefined
            if (props.type !== "checkbox" || index == null || !onToggleTask)
              return <input {...props} />
            return (
              <input
                {...props}
                disabled={false}
                className="cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                onChange={() => onToggleTask(index)}
              />
            )
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
