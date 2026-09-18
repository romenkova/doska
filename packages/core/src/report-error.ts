export type ErrorReporter = (error: unknown) => void

let sink: ErrorReporter = (error) => console.error(error)

export function setErrorReporter(next: ErrorReporter): void {
  sink = next
}

export function reportError(error: unknown): void {
  sink(error)
}
