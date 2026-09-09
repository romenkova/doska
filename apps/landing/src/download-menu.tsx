import { Button } from "@doska/ui-kit"
import { ChevronDown } from "lucide-react"
import { FaLinux, FaWindows } from "react-icons/fa6"
import { SiApple, SiGithub } from "react-icons/si"
import { releasesLatest } from "./links"

const item =
  "flex cursor-pointer items-center gap-2 px-3 py-1.5 outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted [&_svg]:size-4 [&_svg]:shrink-0"

const beta =
  "rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground/70"

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
        <span className="flex items-center gap-2" data-os="mac">
          <SiApple className="size-4" />
          Download for macOS
        </span>
        <span className="flex items-center gap-2" data-os="win" hidden>
          <FaWindows className="size-4" />
          Download for Windows
          <span className={beta}>beta</span>
        </span>
        <span className="flex items-center gap-2" data-os="linux" hidden>
          <FaLinux className="size-4" />
          Download for Linux
          <span className={beta}>beta</span>
        </span>
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
          className={`plausible-event-name=CTA+Download+Windows ${item}`}
          data-exe
        >
          <FaWindows />
          Download for Windows
          <span className={beta}>beta</span>
        </a>
        <a
          role="menuitem"
          href={releasesLatest}
          target="_blank"
          rel="noreferrer"
          className={`plausible-event-name=CTA+Download+Linux ${item}`}
          data-appimage
        >
          <FaLinux />
          Download for Linux
          <span className={beta}>beta</span>
        </a>
        <a
          role="menuitem"
          href={releasesLatest}
          target="_blank"
          rel="noreferrer"
          className={`plausible-event-name=CTA+Download+GitHub ${item}`}
        >
          <SiGithub />
          Download from GH Releases
        </a>
      </div>
    </div>
  )
}
