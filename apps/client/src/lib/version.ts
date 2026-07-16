import { useEffect, useState } from "react"
import { isDesktop } from "./platform"

// The displayed app version.
//
// On desktop the source of truth is the Tauri app version (src-tauri/
// tauri.conf.json, stamped from the git tag in CI) — that's also what the
// updater compares to decide whether a newer build exists, so the UI and the
// update logic stay in agreement.
//
// On web there's no Tauri, so we fall back to the build-time git stamp
// (`__APP_VERSION__`, see vite.config.ts).
export function useAppVersion(): string {
  const [version, setVersion] = useState(__APP_VERSION__)

  useEffect(() => {
    if (!isDesktop()) return
    let active = true
    void import("@tauri-apps/api/app").then(async ({ getVersion }) => {
      const v = await getVersion()
      if (active) setVersion(v)
    })
    return () => {
      active = false
    }
  }, [])

  return version
}
