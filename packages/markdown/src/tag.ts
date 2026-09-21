/**
 * A `#tag` written in a card body
 */
export const TAG_RE = /(^|\s)#(\p{L}[\p{L}\p{N}_-]*)/gu

export function tagsIn(body: string): string[] {
  const names = new Set<string>()
  for (const match of body.matchAll(TAG_RE)) names.add(match[2])
  return [...names]
}
