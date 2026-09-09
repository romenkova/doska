import { renderToString } from "react-dom/server"
import { App } from "./App"

export { app, releases, repo } from "./links"

export function render() {
  return renderToString(<App />)
}
