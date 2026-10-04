import { CardContent, cn } from "@doska/ui-kit"
import type { ReactNode } from "react"
import { CardContentLayout } from "./card-content-layout"

interface IProps {
  header: ReactNode
  attachments: ReactNode
  notice?: ReactNode
  title: ReactNode
  body: ReactNode
  tags?: ReactNode
  /** Fired by clicking the body, where clicking it starts an edit. */
  onClickBody?: (e: React.MouseEvent) => void
  /** The window itself scrolls, so the content must not. */
  inWindow?: boolean
}

/** How a card reads in the panel, whether or not it can be edited there. */
export function CardPaneLayout({
  header,
  attachments,
  notice,
  title,
  body,
  tags,
  onClickBody,
  inWindow,
}: IProps) {
  return (
    <>
      {header}
      <CardContentLayout className={cn(inWindow && "overflow-y-visible")}>
        {tags}
        {attachments}
        {notice}
        <CardContent
          className={cn(
            "flex flex-1 flex-col border-t-0 px-4 pt-2",
            inWindow && "mt-6"
          )}
          onClick={onClickBody}
        >
          {title}
          {body}
        </CardContent>
      </CardContentLayout>
    </>
  )
}
