import { useEffect, type RefObject } from "react"

// Styles that affect where text wraps, so the mirror lays out identically.
const MIRRORED_STYLES = [
  "boxSizing",
  "width",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "lineHeight",
  "textTransform",
  "wordSpacing",
  "tabSize",
  "whiteSpace",
  "wordBreak",
  "overflowWrap",
] as const

/**
 * Measures the caret's viewport-relative top/bottom via a mirror element that
 * clones the textarea's text layout. A textarea gives us no caret geometry
 * directly, so we render the text up to the caret into an off-screen div and
 * read a marker's position.
 */
function caretViewportRange(textarea: HTMLTextAreaElement) {
  const style = window.getComputedStyle(textarea)
  const mirror = document.createElement("div")
  for (const key of MIRRORED_STYLES) mirror.style[key] = style[key]
  mirror.style.position = "absolute"
  mirror.style.visibility = "hidden"
  mirror.style.left = "-9999px"
  mirror.style.height = "auto"

  const caret = textarea.selectionEnd
  mirror.textContent = textarea.value.slice(0, caret)
  const marker = document.createElement("span")
  // Non-empty so the marker has height even at the start of a blank line.
  marker.textContent = textarea.value.slice(caret) || "."
  mirror.appendChild(marker)
  document.body.appendChild(mirror)

  const rect = textarea.getBoundingClientRect()
  const lineHeight = parseFloat(style.lineHeight) || marker.offsetHeight
  const top = rect.top + marker.offsetTop
  document.body.removeChild(mirror)

  return { top, bottom: top + lineHeight }
}

function findScrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement
  while (node) {
    const overflowY = window.getComputedStyle(node).overflowY
    const scrolls = overflowY === "auto" || overflowY === "scroll"
    if (scrolls && node.scrollHeight > node.clientHeight) return node
    node = node.parentElement
  }
  return null
}

const TOP_MARGIN = 24
// Clear the iOS keyboard's accessory bar (the ~44px prev/next arrows + Done
// strip), which docks at the top of the keyboard and isn't always subtracted
// from visualViewport.height. Without this the caret lands behind the bar.
const BOTTOM_MARGIN = 72

/**
 * Keeps the caret line visible while editing. The textarea uses
 * `field-sizing-content` so it never scrolls internally — the browser's native
 * caret-into-view does nothing, and on mobile the caret drifts behind the
 * keyboard. We scroll the nearest scrollable ancestor to follow the caret,
 * measuring the visible area from `visualViewport` so the keyboard is excluded.
 *
 * Fires on typing (`input`), on caret moves and programmatic inserts
 * (`selectionchange` — e.g. picking a slash command splices text and sets the
 * caret without an input event), and when the keyboard opens (viewport resize).
 */
export function useCaretScroll(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    const textarea = textareaRef.current
    if (!enabled || !textarea) return

    function scrollCaretIntoView() {
      const textarea = textareaRef.current
      if (!textarea || document.activeElement !== textarea) return
      // Leave text-selection drags alone; only chase a collapsed caret.
      if (textarea.selectionStart !== textarea.selectionEnd) return
      const scroller = findScrollParent(textarea)
      if (!scroller) return

      const { top, bottom } = caretViewportRange(textarea)
      const viewport = window.visualViewport
      const viewTop = viewport ? viewport.offsetTop : 0
      const viewBottom = viewTop + (viewport ? viewport.height : window.innerHeight)

      if (bottom + BOTTOM_MARGIN > viewBottom) {
        scroller.scrollTop += bottom + BOTTOM_MARGIN - viewBottom
      } else if (top - TOP_MARGIN < viewTop) {
        scroller.scrollTop -= viewTop - (top - TOP_MARGIN)
      }
    }

    textarea.addEventListener("input", scrollCaretIntoView)
    document.addEventListener("selectionchange", scrollCaretIntoView)
    window.visualViewport?.addEventListener("resize", scrollCaretIntoView)

    return () => {
      textarea.removeEventListener("input", scrollCaretIntoView)
      document.removeEventListener("selectionchange", scrollCaretIntoView)
      window.visualViewport?.removeEventListener("resize", scrollCaretIntoView)
    }
  }, [textareaRef, enabled])
}
