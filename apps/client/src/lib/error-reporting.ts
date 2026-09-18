import { createElement } from "react"
import { toast } from "react-hot-toast"
import {
  errorMessage,
  reportError,
  setErrorReporter,
} from "@doska/core/report-error"
import { ErrorToast } from "@/components/toasts/error/error-toast"

// One id for every failure
const TOAST_ID = "error"

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
          message: errorMessage(error),
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
