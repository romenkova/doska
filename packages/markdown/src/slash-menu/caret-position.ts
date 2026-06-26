export interface CaretCoords {
  left: number
  top: number
  height: number
}

/**
 * Measures the pixel coordinates of a caret position inside a textarea.
 */
export function getCaretCoords(
  textarea: HTMLTextAreaElement,
  index: number
): CaretCoords {
  const computed = window.getComputedStyle(textarea)
  const mirror = document.createElement("div")

  for (const prop of computed) {
    mirror.style.setProperty(prop, computed.getPropertyValue(prop))
  }

  mirror.style.position = "absolute"
  mirror.style.visibility = "hidden"
  mirror.style.whiteSpace = "pre-wrap"
  document.body.appendChild(mirror)

  mirror.textContent = textarea.value.slice(0, index)
  const marker = document.createElement("span")
  marker.textContent = textarea.value.slice(index) || "."
  mirror.appendChild(marker)

  const coords: CaretCoords = {
    left: marker.offsetLeft - textarea.scrollLeft,
    top: marker.offsetTop - textarea.scrollTop,
    height: parseInt(computed.lineHeight, 10) || marker.offsetHeight,
  }

  document.body.removeChild(mirror)
  return coords
}
