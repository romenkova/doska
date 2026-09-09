import { CardContent } from "@doska/ui-kit"
import type { ReactNode } from "react"
import { CardContentLayout } from "./card-content-layout"

interface IProps {
  header: ReactNode
  attachments: ReactNode
  title: ReactNode
  body: ReactNode
  /** Fired by clicking the body, where clicking it starts an edit. */
  onClickBody?: (e: React.MouseEvent) => void
}

/** How a card reads in the panel, whether or not it can be edited there. */
export function CardPaneLayout({
  header,
  attachments,
  title,
  body,
  onClickBody,
}: IProps) {
  return (
    <>
      {header}
      <CardContentLayout>
        {attachments}
        <CardContent
          className="flex flex-1 flex-col border-t-0 px-4 pt-2"
          onClick={onClickBody}
        >
          {title}
          {body}
        </CardContent>
      </CardContentLayout>
    </>
  )
}
