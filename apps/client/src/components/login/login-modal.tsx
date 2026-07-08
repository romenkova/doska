import {
  Button,
  Checkbox,
  Input,
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
  cn,
} from "@doska/ui-kit"
import { useEffect, useState, useSyncExternalStore } from "react"
import { useLogin } from "@/lib/data/mutations"
import {
  getServerUrl,
  getSyncFolder,
  getSyncTarget,
  isDesktop,
  setServerUrl,
  setSyncFolder,
  setSyncTarget,
  subscribeSyncConfig,
  type SyncTarget,
} from "@/lib/api/runtime"
import { pickFolder } from "@/lib/api/sync/fs/fs-adapter"
import { sync } from "@/lib/api/sync"
import {
  createStorage,
  hasAttachments,
  migrateAttachments,
  type MigrateProgress,
} from "@/lib/api/attachments"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Set-up-sync dialog. On desktop it offers two backends via tabs — a **Server**
 * (sign in to a remote sync server) or a **Local folder** (two-way Markdown
 * mirror, no account). The web build can't write arbitrary files, so it shows
 * the server form only.
 */
export function LoginModal({ open, onOpenChange }: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-sm">
        {/* Keyed on `open` so the tab/form state resets each time it's opened. */}
        <SyncSetup key={String(open)} onDone={() => onOpenChange(false)} />
      </ModalContent>
    </Modal>
  )
}

/** Body of the set-up dialog: backend tabs plus the active backend's panel. */
function SyncSetup({ onDone }: { onDone: () => void }) {
  const desktop = isDesktop()
  // Seed from the active target so the dialog opens on the current backend; the
  // web build is server-only.
  const [tab, setTab] = useState<SyncTarget>(() =>
    desktop ? getSyncTarget() : "server"
  )

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <ModalTitle>Set up sync</ModalTitle>
        <ModalDescription>
          Your boards stay on this device until you set up sync.
        </ModalDescription>
      </div>

      {desktop && (
        <div className="flex gap-2">
          <TabButton active={tab === "server"} onClick={() => setTab("server")}>
            Server
          </TabButton>
          <TabButton active={tab === "folder"} onClick={() => setTab("folder")}>
            Local folder
          </TabButton>
        </div>
      )}

      {tab === "folder" ? (
        <FolderPanel onDone={onDone} />
      ) : (
        <ServerPanel desktop={desktop} onCancel={onDone} onDone={onDone} />
      )}
    </div>
  )
}

/** A pill-style tab toggle, matching the app's segmented-control look. */
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

/**
 * Migration-checkbox state for a backend switch. Captures the *current* target
 * once (the source we'd migrate from) before the panel switches it, and offers
 * the option only when that source actually holds attachments. Copy is
 * non-destructive; the source keeps its files.
 */
function useFileMigration(from: SyncTarget) {
  // Snapshot the source target at mount — the panel flips it on submit.
  const [source] = useState(() => getSyncTarget())
  const [available, setAvailable] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [progress, setProgress] = useState<MigrateProgress | null>(null)

  useEffect(() => {
    if (source !== from) return
    void hasAttachments().then(setAvailable)
  }, [source, from])

  const run = async () => {
    if (!available || !enabled || source === from) return
    await migrateAttachments(createStorage(from), createStorage(getSyncTarget()), setProgress)
  }

  return { available: available && source === from, enabled, setEnabled, progress, run }
}

/** Checkbox + progress for copying attachment bytes during a backend switch. */
function MigrateFilesField({
  label,
  enabled,
  onEnabledChange,
  progress,
}: {
  label: string
  enabled: boolean
  onEnabledChange: (on: boolean) => void
  progress: MigrateProgress | null
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <Checkbox checked={enabled} onCheckedChange={(v) => onEnabledChange(v)} />
      <span>{label}</span>
      {progress && (
        <span className="ml-auto tabular-nums">
          {progress.done}/{progress.total}
        </span>
      )}
    </label>
  )
}

/** Remote-server backend: URL (desktop) + credentials, then sign in. */
function ServerPanel({
  desktop,
  onCancel,
  onDone,
}: {
  desktop: boolean
  onCancel: () => void
  onDone: () => void
}) {
  const [server, setServer] = useState(() => getServerUrl())
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const { mutate, isPending, isError, reset } = useLogin()
  // Switching in from the folder backend: offer to upload its files to S3.
  const migration = useFileMigration("server")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    // Desktop has no same-origin server — persist the URL before logging in so
    // the auth/sync calls know where to go.
    if (desktop) setServerUrl(server)
    setSyncTarget("server")
    mutate(
      { login, password },
      {
        onSuccess: async () => {
          setPassword("")
          // Upload files while the folder source is still readable on disk.
          await migration.run()
          onDone()
        },
      }
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {desktop && (
          <Input
            name="server"
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="Server URL (https://…)"
            value={server}
            onChange={(e) => setServer(e.target.value)}
          />
        )}
        <Input
          autoFocus
          name="login"
          autoComplete="username"
          placeholder="Login"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
        />
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {isError && (
          <p className="text-xs text-destructive">Invalid credentials.</p>
        )}
      </div>

      {migration.available && (
        <MigrateFilesField
          label="Also upload attached files to the server"
          enabled={migration.enabled}
          onEnabledChange={migration.setEnabled}
          progress={migration.progress}
        />
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            reset()
            onCancel()
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isPending || !login || !password || (desktop && !server.trim())
          }
        >
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </form>
  )
}

/** Local-folder backend: pick a directory to two-way mirror boards into. */
function FolderPanel({ onDone }: { onDone: () => void }) {
  const folder = useSyncExternalStore(subscribeSyncConfig, getSyncFolder)
  // Switching in from the server backend: offer to copy its files onto disk.
  const migration = useFileMigration("folder")

  async function choose() {
    const picked = await pickFolder()
    if (!picked) return
    setSyncFolder(picked)
    setSyncTarget("folder")
    // Seed the folder with the current boards, not just future edits.
    await sync.exportLocalData()
    // Card files now exist on disk, so their `.assets` sidecars can be written.
    await migration.run()
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          Boards mirror to Markdown files in this folder — a folder per board, a
          file per card. Edits made here and in other apps sync both ways.
        </p>
        <Input readOnly value={folder} placeholder="No folder chosen" />
      </div>
      {migration.available && (
        <MigrateFilesField
          label="Also copy attached files into the folder"
          enabled={migration.enabled}
          onEnabledChange={migration.setEnabled}
          progress={migration.progress}
        />
      )}
      <div className="flex justify-end">
        <Button type="button" onClick={() => void choose()}>
          {folder ? "Change folder…" : "Choose folder…"}
        </Button>
      </div>
    </div>
  )
}
