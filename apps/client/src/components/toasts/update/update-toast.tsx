import { toast } from "react-hot-toast"
import { useEffect, useState } from "react"
import { useUpdateState } from "@/lib/update-store"
import { UpdateToastContent } from "./update-toast-content"

const TOAST_ID = "update-available"

/** Persistent install/reload prompt for a newly available app version. */
export function UpdateToast() {
  const state = useUpdateState()
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (state.status === "none") {
      toast.dismiss(TOAST_ID)
      return
    }

    toast.custom(
      (toastInstance) => (
        <UpdateToastContent
          state={state}
          installing={installing}
          visible={toastInstance.visible}
          onInstall={() => {
            setInstalling(true)
            void state.install().catch(() => setInstalling(false))
          }}
        />
      ),
      { duration: Infinity, id: TOAST_ID }
    )
  }, [installing, state])

  return null
}
