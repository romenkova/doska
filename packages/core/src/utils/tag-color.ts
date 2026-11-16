/** Tag colors are keyed case-insensitively, like tags themselves. */
export const tagKey = (tag: string) => tag.toLowerCase()

/** `""` when the tag has no color. */
export function tagColor(colors: Record<string, string>, tag: string) {
  return colors[tagKey(tag)] ?? ""
}
