import { cn } from "@doska/ui-kit"
import { Section } from "./section"

function Screenshot({
  src,
  alt,
  className,
  zoom,
  priority,
}: {
  src: string
  alt: string

  className: string

  zoom: string
  priority?: boolean
}) {
  return (
    <div
      className={cn(
        "h-64 overflow-hidden rounded-2xl border shadow-lg sm:h-auto",
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        fetchPriority={priority ? "high" : undefined}
        className={cn(
          "-m-0.5 block h-[calc(100%+4px)] max-w-none object-cover object-left-top sm:h-auto sm:w-[calc(100%+4px)]",
          zoom
        )}
      />
    </div>
  )
}

export function FolderSection() {
  return (
    <Section
      title="In a folder"
      subtitle={
        <>
          Select a folder to sync your board into. <br />
          Folder per board and column, markdown file per card.
          <br />
          Desktop app only.
        </>
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <Screenshot
          src="/board-dark.png"
          alt="A board with columns of cards"
          className="flex-[1789]"
          zoom="w-[200%]"
          priority
        />
        <Screenshot
          src="/files-dark.png"
          alt="The same board as a folder of markdown files"
          className="flex-[1203]"
          zoom="w-[140%]"
        />
      </div>
    </Section>
  )
}
