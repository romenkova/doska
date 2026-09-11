import { cn, useIsMobile } from "@doska/ui-kit"
import { SlashMenuFab } from "../slash-menu/slash-menu-fab"
import type { EditorOptions } from "./extensions"
import { useEditorView } from "./hooks/use-editor-view"

interface IProps extends EditorOptions {
  className?: string
  containerClassName?: string
  overlayContainer?: HTMLElement | null
}

export function Editor({
  className,
  containerClassName,
  overlayContainer,
  ...options
}: IProps) {
  const isMobile = useIsMobile()
  const { containerRef, view } = useEditorView(options)

  function focusEnd(e: React.MouseEvent) {
    if (!view || view.contentDOM.contains(e.target as Node)) return
    view.dispatch({ selection: { anchor: view.state.doc.length } })
    view.focus()
  }

  return (
    <div className={cn("relative flex w-full flex-col", containerClassName)}>
      <div
        ref={containerRef}
        onClick={focusEnd}
        className={cn(
          "flex w-full flex-col py-2 font-mono",
          "text-base leading-relaxed [font-variant-ligatures:none]",
          className
        )}
      />
      {options.slashMenu && isMobile && (
        <SlashMenuFab
          view={view}
          commands={options.slashCommands}
          container={overlayContainer}
        />
      )}
    </div>
  )
}
