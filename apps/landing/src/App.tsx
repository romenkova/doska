import { Board } from "./board"
import { Hero } from "./hero"
import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"
import "@doska/markdown/markdown.css"

export function App() {
  return (
    <div className="min-h-svh">
      <SiteHeader />
      <Hero />
      <Board />
      <SiteFooter />
    </div>
  )
}
