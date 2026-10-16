import { toast } from "react-hot-toast"
import { useEffect, useRef, useState } from "react"
import { useIsMainWindow } from "@/lib/hooks"
import { webKeyValue } from "@/lib/adapters/web-kv"
import { useShouldOnboard } from "../../onboarding/use-should-onboard"
import { WhatsNewModal } from "../../whats-new/whats-new-modal"
import {
  WHATS_NEW_SEEN_KEY,
  WHATS_NEW_VERSION,
} from "../../whats-new/whats-new-seen"
import { WhatsNewToastContent } from "./whats-new-toast-content"

const TOAST_ID = "whats-new"

export function WhatsNewToast() {
  const [open, setOpen] = useState(false)
  const isMainWindow = useIsMainWindow()
  const shouldOnboard = useShouldOnboard()
  // Signing in during onboarding doesn't pop the toast
  const decided = useRef(false)

  useEffect(() => {
    if (!isMainWindow) {
      toast.dismiss(TOAST_ID)
      return
    }
    if (shouldOnboard === null || decided.current) return
    decided.current = true
    if (shouldOnboard) return
    if (webKeyValue.get(WHATS_NEW_SEEN_KEY) === WHATS_NEW_VERSION) return

    function markSeen() {
      webKeyValue.set(WHATS_NEW_SEEN_KEY, WHATS_NEW_VERSION)
      toast.dismiss(TOAST_ID)
    }

    toast.custom(
      (toastInstance) => (
        <WhatsNewToastContent
          visible={toastInstance.visible}
          onOpen={() => {
            markSeen()
            setOpen(true)
          }}
          onDismiss={markSeen}
        />
      ),
      { duration: Infinity, id: TOAST_ID }
    )
  }, [isMainWindow, shouldOnboard])

  return <WhatsNewModal open={open} onOpenChange={setOpen} />
}
