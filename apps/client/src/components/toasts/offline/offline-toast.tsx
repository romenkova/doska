import {
  continueOffline,
  sync,
  useConnection,
  useOfflineAcknowledged,
} from "@doska/core"
import { toast } from "react-hot-toast"
import { useEffect } from "react"
import { OfflineToastContent } from "./offline-toast-content"

const TOAST_ID = "connection-dropped"

/** Persistent notice for a dropped sync connection. */
export function OfflineToast() {
  const connection = useConnection()
  const acknowledged = useOfflineAcknowledged()
  const dropped = connection.status === "dropped"

  useEffect(() => {
    if (!dropped || acknowledged) {
      toast.dismiss(TOAST_ID)
      return
    }

    toast.custom(
      (toastInstance) => (
        <OfflineToastContent
          onRetry={() => void sync.reconcile()}
          visible={toastInstance.visible}
          onContinueOffline={continueOffline}
        />
      ),
      { duration: Infinity, id: TOAST_ID, position: "top-center" }
    )
  }, [acknowledged, dropped])

  return null
}
