export function sameLines(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((line, i) => line === b[i])
}

export function splitLines(text: string): string[] {
  if (text === "") return []
  const lines = text.split("\n")
  if (lines.at(-1) === "") lines.pop()
  return lines
}
