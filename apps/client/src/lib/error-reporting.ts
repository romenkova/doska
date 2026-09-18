import { createElement } from "react"
import { toast } from "react-hot-toast"
import { reportError, setErrorReporter } from "@doska/core/report-error"
import { ErrorToast } from "@/components/toasts/error/error-toast"

// One id for every failure
const TOAST_ID = "error"

function message(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error) return error
  return "Something went wrong"
}

/**
 * Failures outside a render
 */
export function initErrorReporting(): void {
  setErrorReporter((error) => {
    console.error(error)
    toast.custom(
      (toastInstance) =>
        createElement(ErrorToast, {
          visible: toastInstance.visible,
          message: message(error),
        }),
      { id: TOAST_ID }
    )
  })

  window.addEventListener("unhandledrejection", (event) =>
    reportError(event.reason)
  )

  window.addEventListener("error", (event) =>
    reportError(event.error ?? event.message)
  )
}
