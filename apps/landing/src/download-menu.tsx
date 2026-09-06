import { Button } from "@doska/ui-kit"
import { ChevronDown } from "lucide-react"
import { SiApple, SiGithub } from "react-icons/si"
import { releasesLatest } from "./links"

const item =
  "flex cursor-pointer items-center gap-2 px-3 py-1.5 outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted [&_svg]:size-4 [&_svg]:shrink-0"

export function DownloadMenu() {
  return (
    <div className="relative w-full sm:w-auto" data-menu>
      <Button
        variant="outline"
        size="lg"
        className="h-11 w-full gap-2 px-5 text-base sm:w-auto"
        aria-haspopup="menu"
        aria-expanded="false"
        data-menu-trigger
      >
        <SiApple className="size-4" />
        Download for macOS
        <ChevronDown className="size-4 text-muted-foreground" />
      </Button>
      <div
        role="menu"
        hidden
        className="absolute top-full left-0 z-50 mt-1 min-w-36 overflow-hidden rounded-lg border bg-popover text-sm text-popover-foreground shadow-e3"
        data-menu-popup
      >
        <a
          role="menuitem"
          href={releasesLatest}
          target="_blank"
          rel="noreferrer"
          className={`plausible-event-name=CTA+Download+macOS ${item}`}
          data-dmg
        >
          <SiApple />
          Download macOS app
        </a>
        <a
          role="menuitem"
          href={releasesLatest}
          target="_blank"
          rel="noreferrer"
          className={`plausible-event-name=CTA+Download+GitHub ${item}`}
        >
          <SiGithub />
          Download from GitHub Releases
        </a>
      </div>
    </div>
  )
}
