import { BottomBadges } from "./bottom-badges"
import { Hero } from "./hero"
import { DevicesSection } from "./sections/devices-section"
import { FeaturesSection } from "./sections/features-section"
import { FolderSection } from "./sections/folder-section"
import { SharingSection } from "./sections/sharing-section"
import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"

export function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <FolderSection />
        <DevicesSection />
        <SharingSection />
        <FeaturesSection />
      </main>
      <SiteFooter />
      <BottomBadges />
    </div>
  )
}
