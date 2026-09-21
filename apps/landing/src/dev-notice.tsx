import { issues } from "./links"

export function DevNotice() {
  return (
    <p className="mt-7 font-mono text-sm tracking-tight text-muted-foreground">
      Doska is in active development.{" "}
      <a
        href={issues}
        target="_blank"
        rel="noreferrer"
        className="plausible-event-name=Notice+Issues text-foreground underline underline-offset-4"
      >
        Report bugs and request features
      </a>
      .
    </p>
  )
}
