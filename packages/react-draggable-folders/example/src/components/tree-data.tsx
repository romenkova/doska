import { highlight } from "sugar-high"
import type { Entry } from "../lib/data"
import { CopyButton } from "./copy-button"

interface IProps {
  nodes: Entry[]
}

/** What `onChange` would hand you to persist. */
export function TreeData({ nodes }: IProps) {
  const json = JSON.stringify(nodes, null, 2)
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-200 pr-2 pl-4 dark:border-zinc-800">
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          onChange(nodes)
        </span>
        <CopyButton text={json} />
      </div>
      <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-xs/5">
        <code
          dangerouslySetInnerHTML={{
            __html: highlight(json, { lang: "json" }),
          }}
        />
      </pre>
    </div>
  )
}
