/**
 * The MCP server is a headless sync client, so it needs the same thing the app
 * needs: a server to talk to and the single account's credentials. Boards that
 * only ever lived in a browser's IndexedDB are not reachable from here.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

export const config = {
  url: (process.env.DOSKA_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  login: required("DOSKA_LOGIN"),
  password: required("DOSKA_PASSWORD"),
}
