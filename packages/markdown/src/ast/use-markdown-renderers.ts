import { createContext, useContext } from "react"
import type { MarkdownRenderers } from "./renderers"

const NONE: MarkdownRenderers = {}

export const MarkdownRenderersContext = createContext<MarkdownRenderers>(NONE)

export function useMarkdownRenderers() {
  return useContext(MarkdownRenderersContext)
}
