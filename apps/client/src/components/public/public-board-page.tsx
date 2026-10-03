import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useRoute } from "wouter"
import { usePublicBoard, PublicBoardNotFound } from "@doska/core"
import { routes } from "@/lib/routes"
import { PublicBoard } from "./public-board"
import { PublicCardPanel } from "./public-card-panel"
import { PublicCentered } from "./public-centered"
import { PublicShell } from "./public-shell"

interface IProps {
  token: string
  /** The board's own path, which the card panel closes back to. */
  closeHref: string
}

/**
 * A published board. One fetch, no session and no local database: nothing here
 * is written down, so a visitor leaves with an empty browser.
 */
export function PublicBoardPage({ token, closeHref }: IProps) {
  const { data: snapshot, isPending, error } = usePublicBoard(token)
  const [isCardOpen] = useRoute(routes.card.pattern)
  const title = snapshot?.dashboard.title

  useEffect(() => {
    document.title = title ? `${title} · Doska` : "Doska"
  }, [title])

  if (isPending)
    return (
      <PublicShell>
        <PublicCentered>
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </PublicCentered>
      </PublicShell>
    )

  if (error || !snapshot)
    return (
      <PublicShell>
        <PublicCentered>
          <p className="max-w-md text-center text-muted-foreground">
            {error instanceof PublicBoardNotFound
              ? "This board is not shared, or the link has been turned off."
              : "Could not load this board. Try again in a moment."}
          </p>
        </PublicCentered>
      </PublicShell>
    )

  return (
    <PublicShell
      title={snapshot.dashboard.title}
      isCardOpen={isCardOpen}
      panel={
        <PublicCardPanel
          token={token}
          snapshot={snapshot}
          closeHref={closeHref}
        />
      }
    >
      <PublicBoard token={token} snapshot={snapshot} />
    </PublicShell>
  )
}
