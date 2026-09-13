import { readFileSync } from "node:fs"
import { mergeBody } from "../src/index"

const read = (name: string) =>
  readFileSync(new URL(`./${name}.md`, import.meta.url), "utf8")

const { body, conflict } = mergeBody(read("base"), read("ours"), read("theirs"))

console.log(body)
console.log("----")
console.log(`conflict: ${conflict}`)
