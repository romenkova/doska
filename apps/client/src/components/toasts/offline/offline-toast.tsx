import { sync, useConnection } from "@doska/core"
import { toast } from "react-hot-toast"
import { useEffect, useState } from "react"
import { OfflineToastContent } from "./offline-toast-content"

const TOAST_ID = "connection-dropped"

/** Persistent notice for a dropped sync connection. */
export function OfflineToast() {
  const connection = useConnection()
  const dropped = connection.status === "dropped"
  const [dismissed, setDismissed] = useState(false)
  const [wasDropped, setWasDropped] = useState(dropped)
  if (wasDropped !== dropped) {
    setWasDropped(dropped)
    setDismissed(false)
  }

  useEffect(() => {
    if (!dropped || dismissed) {
      toast.dismiss(TOAST_ID)
      return
    }

    toast.custom(
      (toastInstance) => (
        <OfflineToastContent
          onRetry={sync.reconcile}
          visible={toastInstance.visible}
          onDismiss={() => {
            setDismissed(true)
            toast.dismiss(toastInstance.id)
          }}
        />
      ),
      { duration: Infinity, id: TOAST_ID, position: "top-center" }
    )
  }, [dismissed, dropped])

  return null
}
