import { createContext, useContext, type ReactNode } from "react"

/**
 * Hooks for the pieces of a body that only the host app can resolve — an
 * attachment key to an image, a wikilink target to whatever it names.
 * `Markdown` reads them
 * from context rather than taking them as props, so adding one doesn't have to
 * be threaded through every wrapper between the call site and the renderer.
 */
export interface MarkdownRenderers {
  /** Renders an `attachment:<key>` image ref. */
  renderImage?: (attachmentKey: string, alt: string) => ReactNode
  /** Renders a `[[target]]` wikilink. */
  renderWikilink?: (target: string) => ReactNode
}

const NONE: MarkdownRenderers = {}

const MarkdownRenderersContext = createContext<MarkdownRenderers>(NONE)

/**
 * Provides the renderers for the bodies rendered beneath it. Mount it wherever
 * the data they need is in scope — image refs resolve per card, so the card is
 * the natural place. Unprovided refs fall back to plain markdown.
 */
export const MarkdownRenderersProvider = MarkdownRenderersContext.Provider

export function useMarkdownRenderers() {
  return useContext(MarkdownRenderersContext)
}
