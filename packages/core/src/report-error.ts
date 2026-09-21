export type ErrorReporter = (error: unknown) => void

export interface ReportedError {
  at: number
  message: string
  stack?: string
}

const LOG_LIMIT = 20

const log: ReportedError[] = []

let sink: ErrorReporter = (error) => console.error(error)

export function setErrorReporter(next: ErrorReporter): void {
  sink = next
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error) return error
  return "Something went wrong"
}

export function errorLog(): readonly ReportedError[] {
  return log
}

export function reportError(error: unknown): void {
  log.push({
    at: Date.now(),
    message: errorMessage(error),
    stack: error instanceof Error ? error.stack : undefined,
  })
  if (log.length > LOG_LIMIT) log.shift()
  sink(error)
}
