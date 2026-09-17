import { SidebarInset, SidebarProvider, cn } from "@doska/ui-kit"
import type { ReactNode } from "react"
import { useRoute } from "wouter"
import { AppSidebar } from "@/components"
import { CardRevealProvider } from "@/providers/card-reveal/card-reveal-provider"
import { CardDropProvider } from "@/providers/card-drop/card-drop-provider"
import { CardPanel } from "@/components/card-panel/card-panel"
import { DeckProvider } from "@/providers/deck/deck-context"
import { useUndoShortcut } from "@/lib/hooks"
import { routes } from "@/lib/routes"

interface IProps {
  deck: { id: string; sort: string[] }
  cardCloseHref?: string
  children: ReactNode
}

export function AppShell({ deck, cardCloseHref, children }: IProps) {
  const [isCardOpen] = useRoute(routes.card.pattern)

  // ⌘Z takes back the last delete from anywhere in the app.
  useUndoShortcut()

  return (
    <DeckProvider value={deck}>
      <CardRevealProvider>
        <CardDropProvider>
          {/* `--app-height` tracks the keyboard on touch devices; `svh` elsewhere. */}
          <SidebarProvider className="h-(--app-height,100svh)">
            <AppSidebar />
            <SidebarInset
              className={cn(
                "min-w-0 overflow-hidden border border-border",
                "md:peer-data-[state=collapsed]:border-0",
                "md:transition-[margin,border-radius] md:duration-200 md:ease-linear",
                isCardOpen && "md:mr-0 md:peer-data-[state=collapsed]:border-r"
              )}
            >
              {children}
            </SidebarInset>
            {cardCloseHref && <CardPanel closeHref={cardCloseHref} />}
          </SidebarProvider>
        </CardDropProvider>
      </CardRevealProvider>
    </DeckProvider>
  )
}
