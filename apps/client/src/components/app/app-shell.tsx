import { SidebarInset, SidebarProvider, cn } from "@doska/ui-kit"
import type { ReactNode } from "react"
import { useRoute } from "wouter"
import { AppSidebar } from "@/components"
import { CardPanel } from "@/components/card-panel/card-panel"
import { DeckProvider } from "@/components/deck/deck-context"
import { routes } from "@/lib/routes"

interface IProps {
  deck: { id: string; prefix: string }
  cardCloseHref?: string
  children: ReactNode
}

export function AppShell({ deck, cardCloseHref, children }: IProps) {
  const [isCardOpen] = useRoute(routes.card.pattern)

  return (
    <DeckProvider value={deck}>
      <SidebarProvider className="h-svh">
        <AppSidebar />
        <SidebarInset
          className={cn(
            "min-w-0 overflow-hidden border border-border",
            "md:transition-[margin] md:duration-200 md:ease-linear",
            isCardOpen && "md:mr-0"
          )}
        >
          {children}
        </SidebarInset>
        {cardCloseHref && <CardPanel closeHref={cardCloseHref} />}
      </SidebarProvider>
    </DeckProvider>
  )
}
