import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { remarkMark } from "remark-mark-highlight"
import { cn } from "@/lib/utils"
import "./markdown.css"

interface IProps {
  children: string
  className?: string
}

export function Markdown({ children, className }: IProps) {
  return (
    <div className={cn("markdown", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMark]}
        components={{
          a: (props) => (
            <a
              {...props}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
