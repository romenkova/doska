import { useState } from "react"
import { cn } from "../lib/cn"
import { CopyButton } from "./copy-button"

const COMMANDS = {
  npm: "npm i react-draggable-folders",
  pnpm: "pnpm add react-draggable-folders",
  yarn: "yarn add react-draggable-folders",
  bun: "bun add react-draggable-folders",
}

type Manager = keyof typeof COMMANDS

const MANAGERS = Object.keys(COMMANDS) as Manager[]

export function InstallCommand() {
  const [manager, setManager] = useState<Manager>("npm")
  const command = COMMANDS[manager]

  return (
    <div className="inline-flex flex-col overflow-hidden rounded-xl bg-zinc-50 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="flex gap-1 border-b border-zinc-200 px-2 pt-1.5 dark:border-zinc-800">
        {MANAGERS.map((one) => (
          <button
            key={one}
            type="button"
            onClick={() => setManager(one)}
            className={cn(
              "-mb-px border-b-2 border-transparent px-2 pb-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              one === manager &&
                "border-zinc-950 text-zinc-950 dark:border-zinc-50 dark:text-zinc-50"
            )}
          >
            {one}
          </button>
        ))}
      </div>
      <div className="flex h-10 items-center justify-between gap-3 pr-1.5 pl-4 font-mono text-[13px]">
        <span>
          <span className="text-zinc-400 select-none dark:text-zinc-500">
            ${" "}
          </span>
          {command}
        </span>
        <CopyButton text={command} />
      </div>
    </div>
  )
}
