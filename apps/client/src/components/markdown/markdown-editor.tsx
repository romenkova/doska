import { cn } from "@doska/ui-kit"
import type { ComponentType } from "react"
import {
  toggleTaskByIndex,
  useMarkers,
  type Marker,
  type SlashCommand,
  type WikilinkOption,
} from "@doska/markdown"
import { Editor } from "./editor/editor"

interface PreviewProps {
  children: string
  className?: string
  onToggleTask?: (index: number) => void
}

export interface MarkdownEditorProps {
  isPreview?: boolean
  renderPreview: ComponentType<PreviewProps>
  value?: string
  onChangeValue?: (value: string) => void
  autoFocus?: boolean
  placeholder?: string
  className?: string
  markers?: Marker[]
  onToggleTask?: (value: string) => void
  slashMenu?: boolean
  markdown?: boolean
  slashCommands?: SlashCommand[]
  wikilinks?: WikilinkOption[]
  onPasteFiles?: (files: File[]) => Promise<string | null>
  containerClassName?: string
  /**
   * Where the mobile slash button renders. Must be a non-scrolling ancestor, or
   * the button scrolls away with the text.
   */
  overlayContainer?: HTMLElement | null
}

const NO_MARKERS: Marker[] = []
const NOOP = () => {}

export function MarkdownEditor({
  isPreview,
  renderPreview: Preview,
  value = "",
  onChangeValue,
  autoFocus,
  placeholder,
  className,
  markers = NO_MARKERS,
  onToggleTask,
  slashMenu,
  markdown,
  slashCommands,
  wikilinks,
  onPasteFiles,
  containerClassName,
  overlayContainer,
}: MarkdownEditorProps) {
  const { body } = useMarkers(value, markers, "preview")

  if (isPreview)
    return (
      <div className={cn("space-y-4 pt-3 select-text", containerClassName)}>
        {body && (
          <Preview
            className={className}
            onToggleTask={
              onToggleTask
                ? (index) => onToggleTask(toggleTaskByIndex(value, index))
                : undefined
            }
          >
            {body}
          </Preview>
        )}
      </div>
    )

  return (
    <Editor
      value={value}
      onChangeValue={onChangeValue ?? NOOP}
      autoFocus={autoFocus}
      placeholder={placeholder}
      className={className}
      slashMenu={slashMenu}
      markdown={markdown}
      slashCommands={slashCommands}
      wikilinks={wikilinks}
      onPasteFiles={onPasteFiles}
      containerClassName={containerClassName}
      overlayContainer={overlayContainer}
    />
  )
}
