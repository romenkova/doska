import { Marked } from "marked"
import { highlight } from "sugar-high"
import readme from "../../../README.md?raw"

const marked = new Marked({
  renderer: {
    code: ({ text }) => `<pre><code>${highlight(text)}</code></pre>`,
  },
})

const api = readme.slice(
  readme.indexOf("## Quick start"),
  readme.indexOf("## Development")
)
const html = marked.parse(api, { async: false })

export function Docs() {
  return (
    <article
      className="docs mt-16"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
