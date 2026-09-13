import {
  Card as CardBase,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  MdImage,
  cn,
} from "@doska/ui-kit"
import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react"
import {
  cut,
  soleImage,
  taskProgress,
  useMarkers,
  type SoleImage,
} from "@doska/markdown"
import type { Card, Column } from "@doska/core/types"
import { MarkdownCardPreview } from "../markdown"
import { CardMeta } from "./card-meta"
import { ImageCard } from "./image-card"
import { cardSoleImage } from "./sole-image"

const BOARD_MARKERS = [cut]

/** Cancels `MdImage`'s standalone-image spacing so the image can fill the card. */
const FULL_BLEED = "my-0 w-full rounded-none"

interface IProps extends DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> {
  card: Card
  column?: Column | null
  showBody: boolean
  isDragging?: boolean
  /** Flashes a ring, to point out the card a search result led to. */
  isRevealed?: boolean
  /** Top-right slot: the card menu where the viewer can act on the card. */
  action?: ReactNode
  /** Opens the title row, for a checkbox or the like. */
  lead?: ReactNode
  /** Opens the meta row, for the card's column or board. */
  metaLead?: ReactNode
  /** Off where a card whose whole body is one image should still read as an
   * ordinary card, as in the digest. */
  imageCard?: boolean
  /** Omit to leave the body's task checkboxes inert. */
  onChangeBody?: (body: string) => void
  onChangeDeadline?: (deadline: string | null) => void
  onChangePriority?: (priority: string) => void
  /** The card's attachments, drawn by whoever can resolve their URLs. */
  attachments?: ReactNode
  /** Draws an `attachment:<key>` image; the app and a public board find it differently. */
  renderAttachmentImage: (
    key: string,
    alt: string,
    className: string
  ) => ReactNode
  /**
   * Wraps the card itself, inside the outer element. The outer one holds the
   * drag ref and must stay outermost, so a context menu has to go here.
   */
  wrapCard?: (card: ReactNode) => ReactNode
}

/** A board card. Everything it cannot resolve itself arrives as a prop. */
export function CardView({
  card,
  column,
  showBody,
  isDragging,
  isRevealed,
  action,
  lead,
  metaLead,
  imageCard = true,
  onChangeBody,
  onChangeDeadline,
  onChangePriority,
  attachments,
  renderAttachmentImage,
  wrapCard = (card) => card,
  className,
  ...props
}: IProps) {
  const { title, body } = card
  const { body: preview, applied } = useMarkers(body, BOARD_MARKERS, "card")
  const hasBody = preview.trim().length > 0
  const hasMore = applied.includes(cut.name)
  const files = card.attachments ?? []
  const bodyImage = hasBody && !hasMore ? soleImage(preview) : null
  const image = imageCard ? cardSoleImage(hasBody, bodyImage, files) : null

  const drawImage = (image: SoleImage) =>
    image.source.kind === "attachment" ? (
      renderAttachmentImage(image.source.key, image.alt, FULL_BLEED)
    ) : (
      <MdImage src={image.source.url} alt={image.alt} className={FULL_BLEED} />
    )

  const tasks = taskProgress(body)
  const hasMeta =
    !!metaLead ||
    tasks.total > 0 ||
    !!card.deadline ||
    !!card.priority ||
    !!card.bodyConflict

  return (
    <div
      {...props}
      className={cn(
        "group relative mb-3 w-full max-w-sm cursor-pointer scroll-mx-6 scroll-mt-[calc(--spacing(15)+10px)] rounded-xl",
        "touch-manipulation select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]",
        isRevealed &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background transition-shadow",
        className
      )}
    >
      {wrapCard(
        image ? (
          <ImageCard title={title} isDragging={isDragging} action={action}>
            {drawImage(image)}
          </ImageCard>
        ) : (
          <CardBase
            className={cn(
              isDragging && "bg-card/70 shadow-e3 backdrop-blur-md"
            )}
          >
            <CardHeader>
              <CardTitle className={cn(lead && "flex items-start gap-2")}>
                {lead}
                <span>{title || "Untitled card"}</span>
              </CardTitle>
              {action && (
                <CardAction className="flex items-center gap-1">
                  {action}
                </CardAction>
              )}
            </CardHeader>
            {hasMeta && (
              <CardContent>
                <CardMeta
                  card={card}
                  column={column}
                  tasks={tasks}
                  lead={metaLead}
                  onChangeDeadline={onChangeDeadline}
                  onChangePriority={onChangePriority}
                  className="mt-2"
                />
              </CardContent>
            )}
            {hasBody && (
              <div
                className={cn(
                  "grid transition-[grid-template-rows,margin] duration-200 ease-out",
                  // Collapsed, the row is 0px but still a flex child: cancel the card's gap.
                  showBody ? "grid-rows-[1fr]" : "-mt-2 grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <CardContent className="space-y-3 pt-2">
                    <MarkdownCardPreview
                      preview={preview}
                      body={body}
                      hasMore={hasMore}
                      onChangeBody={onChangeBody}
                    />
                  </CardContent>
                </div>
              </div>
            )}
            {files.length > 0 && showBody && attachments}
          </CardBase>
        )
      )}
    </div>
  )
}
