const appOrigin = import.meta.env.DEV
  ? "http://localhost:5173"
  : "https://app.doska.sh"

export const app = `${appOrigin}/d/welcome`
// bakemd serves the docs on its own port in dev (see @doska/docs).
export const docs = import.meta.env.DEV
  ? "http://localhost:5175/docs/"
  : "/docs/"
export const author = "https://github.com/romenkova"
export const repo = `${author}/doska`
export const releases = `${repo}/releases`
export const releasesLatest = `${releases}/latest`
export const repoApi = "https://api.github.com/repos/romenkova/doska"
