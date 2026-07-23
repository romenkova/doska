import { useEffect, useState } from "react"

const TYPE_MS = 55
const DELETE_MS = 28
const HOLD_MS = 2000

/**
 * Types one phrase, deletes it, moves to the next. Starts fully typed on the
 * first phrase so SSR and reduced-motion both render a complete sentence.
 */
export function Typewriter({ phrases }: { phrases: string[] }) {
  const [index, setIndex] = useState(0)
  const [length, setLength] = useState(phrases[0].length)
  const [deleting, setDeleting] = useState(false)
  // The sizing spacers are real text nodes, so keeping them out of the
  // prerendered HTML stops crawlers reading the heading as every phrase at once.
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: gate prerendered HTML on mount
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const phrase = phrases[index]
    let delay = deleting ? DELETE_MS : TYPE_MS
    let next = () => setLength(length + (deleting ? -1 : 1))

    if (!deleting && length === phrase.length) {
      delay = HOLD_MS
      next = () => setDeleting(true)
    } else if (deleting && length === 0) {
      next = () => {
        setDeleting(false)
        setIndex((i) => (i + 1) % phrases.length)
      }
    }

    const timer = setTimeout(next, delay)
    return () => clearTimeout(timer)
  }, [phrases, index, length, deleting])

  return (
    // Every phrase shares one grid cell, so the cell is as tall as the tallest
    // of them and the heading never reflows mid-word.
    <span className="grid">
      {mounted &&
        phrases.map((phrase) => (
          <span
            key={phrase}
            className="invisible col-start-1 row-start-1"
            aria-hidden
          >
            {phrase}
          </span>
        ))}
      <span className="col-start-1 row-start-1">
        {phrases[index].slice(0, length)}
        <span className="ml-0.5 inline-block h-[0.8em] w-0.75 animate-terminal-blink bg-primary align-baseline motion-reduce:hidden" />
      </span>
    </span>
  )
}
