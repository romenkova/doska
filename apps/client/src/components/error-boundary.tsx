import { Button, buttonVariants, cn } from "@doska/ui-kit"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { isDesktop } from "@/lib/platform"

const ISSUE_URL = "https://github.com/romenkova/doska/issues/new"

/** GitHub drops the prefill past roughly 8k of URL, so the stack gets a budget. */
const STACK_BUDGET = 4000

interface IProps {
  children: ReactNode
  error?: Error
}

interface IState {
  error: Error | null
  version: string
}

/**
 * Without this a throw during render unmounts the whole tree and leaves the
 * window showing nothing but the body background — and on desktop there is no
 * inspector to read the stack from, so the message has to be on screen, and
 * has to be reportable without one.
 */
export class ErrorBoundary extends Component<IProps, IState> {
  state: IState = { error: this.props.error ?? null, version: __APP_VERSION__ }

  static getDerivedStateFromError(error: Error): Partial<IState> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error", error, info.componentStack)
    // On desktop the version worth reporting is the packaged app's, not the
    // bundle's git stamp — see `useAppVersion`.
    if (!isDesktop()) return
    void import("@tauri-apps/api/app").then(async ({ getVersion }) =>
      this.setState({ version: await getVersion() })
    )
  }

  private issueHref(error: Error): string {
    // Keys match the field ids in .github/ISSUE_TEMPLATE/crash.yml — that is
    // how an issue form takes a prefill. Renaming one there breaks it here.
    const params = new URLSearchParams({
      template: "crash.yml",
      title: `Crash: ${error.message}`,
      stack: (error.stack ?? "").slice(0, STACK_BUDGET) || error.message,
      environment: [
        `Version: ${this.state.version}`,
        `Platform: ${isDesktop() ? "desktop" : "web"}`,
        `User agent: ${navigator.userAgent}`,
      ].join("\n"),
    })
    return `${ISSUE_URL}?${params}`
  }

  render() {
    const { error } = this.state
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
        <div className="flex items-center gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          {/* `target="_blank"` is what `initExternalLinks` hands to the system
              browser on desktop; the webview cannot show GitHub itself. */}
          <a
            href={this.issueHref(error)}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Report an issue
          </a>
        </div>
      </div>
    )
  }
}
