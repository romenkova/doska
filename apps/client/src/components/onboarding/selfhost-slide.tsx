import { Markdown } from "@doska/ui-kit"
import { SyncSetup } from "../login/sync-setup"
import selfhost from "./slides/selfhost.md?raw"

interface IProps {
  onDone: () => void
}

export function SelfhostSlide({ onDone }: IProps) {
  return (
    <>
      <Markdown>{selfhost}</Markdown>
      <div className="mt-4">
        <SyncSetup onDone={onDone} />
      </div>
    </>
  )
}
