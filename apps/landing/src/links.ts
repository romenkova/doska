/** Dev points at the local client, so the CTA opens the board you're editing. */
const appOrigin = import.meta.env.DEV
  ? "http://localhost:5173"
  : "https://app.doska.sh"

export const app = `${appOrigin}/d/welcome`
export const author = "https://github.com/romenkova"
export const repo = `${author}/doska`
export const releases = `${repo}/releases`
