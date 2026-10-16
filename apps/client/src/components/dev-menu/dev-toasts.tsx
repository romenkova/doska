import { toast, type ToastOptions } from "react-hot-toast"
import type { ReactElement } from "react"
import { AddCardBlockedToast } from "../toasts/add-card-blocked/add-card-blocked-toast"
import { CardDeleteToast } from "../toasts/card-delete/card-delete-toast"
import { UNDO_TOASTER_ID } from "../toasts/card-delete/undo-toaster"
import { CardMoveToast } from "../toasts/card-move/card-move-toast"
import { ErrorToast } from "../toasts/error/error-toast"
import { OfflineToastContent } from "../toasts/offline/offline-toast-content"
import { UpdateToastContent } from "../toasts/update/update-toast-content"
import { VaultUnlinkedToast } from "../toasts/vault-unlinked/vault-unlinked-toast"
import { WhatsNewToastContent } from "../toasts/whats-new/whats-new-toast-content"

const install = async () => {}

function show(
  id: string,
  render: (visible: boolean, dismiss: () => void) => ReactElement,
  options: ToastOptions = {}
) {
  const dismiss = () => toast.dismiss(id)
  toast.custom((t) => render(t.visible, dismiss), {
    id,
    duration: 6000,
    ...options,
  })
}

export const DEV_TOASTS = [
  {
    label: "Update (desktop)",
    show: () =>
      show("dev-update-desktop", (visible, dismiss) => (
        <UpdateToastContent
          visible={visible}
          installing={false}
          state={{
            status: "available",
            kind: "desktop",
            version: "9.9.9",
            install,
          }}
          onInstall={dismiss}
        />
      )),
  },
  {
    label: "Update (web)",
    show: () =>
      show("dev-update-web", (visible, dismiss) => (
        <UpdateToastContent
          visible={visible}
          installing={false}
          state={{ status: "available", kind: "web", install }}
          onInstall={dismiss}
        />
      )),
  },
  {
    label: "Server version mismatch",
    show: () =>
      show("dev-update-mismatch", (visible, dismiss) => (
        <UpdateToastContent
          visible={visible}
          installing={false}
          state={{ status: "mismatch", version: "9.9.9", install }}
          onInstall={dismiss}
        />
      )),
  },
  {
    label: "Offline",
    show: () =>
      show(
        "dev-offline",
        (visible, dismiss) => (
          <OfflineToastContent
            visible={visible}
            onRetry={dismiss}
            onContinueOffline={dismiss}
          />
        ),
        { position: "top-center" }
      ),
  },
  {
    label: "What's new",
    show: () =>
      show("dev-whats-new", (visible, dismiss) => (
        <WhatsNewToastContent
          visible={visible}
          onOpen={dismiss}
          onDismiss={dismiss}
        />
      )),
  },
  {
    label: "Card deleted",
    show: () =>
      show(
        `dev-card-delete-${Date.now()}`,
        (visible, dismiss) => (
          <CardDeleteToast
            visible={visible}
            title="Fix the sync bug"
            onUndo={dismiss}
          />
        ),
        { toasterId: UNDO_TOASTER_ID }
      ),
  },
  {
    label: "Card moved",
    show: () =>
      show("dev-card-move", (visible) => (
        <CardMoveToast visible={visible} title="Personal" />
      )),
  },
  {
    label: "Error",
    show: () =>
      show("dev-error", (visible) => (
        <ErrorToast visible={visible} message="Upload failed: file too big." />
      )),
  },
  {
    label: "Add card blocked",
    show: () =>
      show("dev-add-card-blocked", (visible) => (
        <AddCardBlockedToast
          visible={visible}
          reason="Clear the filter to add cards."
        />
      )),
  },
  {
    label: "Vault unlinked",
    show: () =>
      show("dev-vault-unlinked", (visible) => (
        <VaultUnlinkedToast visible={visible} path="~/Notes/doska" />
      )),
  },
]
