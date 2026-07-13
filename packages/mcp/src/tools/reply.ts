/** Tool results are JSON in a text block — the shape MCP clients read back. */
export function reply(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  }
}
