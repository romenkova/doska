import { Button, buttonVariants, cn } from "@doska/ui-kit"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { Check, Copy } from "lucide-react"
import { errorLog, type ReportedError } from "@doska/core/report-error"
import { isDesktop } from "@/lib/platform"

const ISSUE_URL = "https://github.com/romenkova/doska/issues/new"

/** GitHub drops the prefill past roughly 8k of URL, so the stack gets a budget. */
const STACK_BUDGET = 4000

const LOG_BUDGET = 2000

interface IProps {
  children: ReactNode
  error?: Error
}

interface IState {
  error: Error | null
  version: string
  log: ReportedError[]
  copied: boolean
}

export class ErrorBoundary extends Component<IProps, IState> {
  state: IState = {
    error: this.props.error ?? null,
    version: __APP_VERSION__,
    log: [...errorLog()],
    copied: false,
  }

  private timer: ReturnType<typeof setTimeout> | undefined

  static getDerivedStateFromError(error: Error): Partial<IState> {
    return { error, log: [...errorLog()] }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error", error, info.componentStack)
    if (!isDesktop()) return
    void import("@tauri-apps/api/app").then(async ({ getVersion }) =>
      this.setState({ version: await getVersion() })
    )
  }

  componentWillUnmount() {
    clearTimeout(this.timer)
  }

  private environment(): string {
    return [
      `Version: ${this.state.version}`,
      `Platform: ${isDesktop() ? "desktop" : "web"}`,
      `User agent: ${navigator.userAgent}`,
    ].join("\n")
  }

  private logText(stacks: boolean): string {
    return [...this.state.log]
      .reverse()
      .map(({ at, message, stack }) => {
        const head = `${new Date(at).toISOString()} ${message}`
        return stacks && stack ? `${head}\n${stack}` : head
      })
      .join(stacks ? "\n\n" : "\n")
  }

  private issueHref(error: Error): string {
    const stack = (error.stack ?? "").slice(0, STACK_BUDGET) || error.message
    const earlier = this.state.log.length
      ? `\n\nEarlier errors:\n${this.logText(false).slice(0, LOG_BUDGET)}`
      : ""

    // Keys match the field ids in .github/ISSUE_TEMPLATE/crash.yml
    const params = new URLSearchParams({
      template: "crash.yml",
      title: `Crash: ${error.message}`,
      stack: stack + earlier,
      environment: this.environment(),
    })
    return `${ISSUE_URL}?${params}`
  }

  private copy = async (error: Error) => {
    const report = [
      error.stack ?? error.message,
      this.environment(),
      this.state.log.length && `Earlier errors:\n${this.logText(true)}`,
    ]
      .filter(Boolean)
      .join("\n\n")

    await navigator.clipboard?.writeText(report)
    this.setState({ copied: true })
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.setState({ copied: false }), 1000)
  }

  render() {
    const { error, log, copied } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold">Something broke</h1>
          <p className="text-sm text-muted-foreground">
            {error.message || String(error)}
          </p>
        </div>
        {error.stack && (
          <pre className="max-h-64 max-w-full overflow-auto rounded-lg bg-muted p-3 text-left font-mono text-xs text-muted-foreground">
            {error.stack}
          </pre>
        )}
        {log.length > 0 && (
          <details className="max-w-full text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              {log.length} earlier {log.length === 1 ? "error" : "errors"}
            </summary>
            <pre className="mt-2 max-h-48 max-w-full overflow-auto rounded-lg bg-muted p-3 font-mono text-xs text-muted-foreground">
              {this.logText(false)}
            </pre>
          </details>
        )}
        <div className="flex items-center gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <a
            href={this.issueHref(error)}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Report an issue
          </a>
          <Button variant="outline" onClick={() => void this.copy(error)}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy details"}
          </Button>
        </div>
      </div>
    )
  }
}
