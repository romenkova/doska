import { repoApi } from "./links"

const html = document.documentElement

document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
  const dark = html.classList.toggle("dark")
  html.classList.toggle("light", !dark)
  localStorage.setItem("theme", dark ? "dark" : "light")
})

const menu = document.querySelector<HTMLElement>("[data-menu]")
const menuTrigger = menu?.querySelector<HTMLButtonElement>(
  "[data-menu-trigger]"
)
const menuPopup = menu?.querySelector<HTMLElement>("[data-menu-popup]")
if (menu && menuTrigger && menuPopup) {
  let open = false
  const setOpen = (next: boolean) => {
    open = next
    menuPopup.hidden = !open
    menuTrigger.setAttribute("aria-expanded", String(open))
  }
  menuTrigger.addEventListener("click", () => setOpen(!open))
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target as Node)) setOpen(false)
  })
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false)
  })
}

const ua = navigator.userAgent
const os = ua.includes("Windows")
  ? "win"
  : ua.includes("Linux") && !ua.includes("Android")
    ? "linux"
    : null
if (os) {
  for (const label of document.querySelectorAll<HTMLElement>("[data-os]"))
    label.hidden = label.dataset.os !== os
}

const downloads = [
  ["a[data-dmg]", ".dmg"],
  ["a[data-exe]", "-setup.exe"],
  ["a[data-appimage]", ".AppImage"],
].map(([selector, suffix]) => ({
  link: document.querySelector<HTMLAnchorElement>(selector),
  suffix,
}))
if (downloads.some((d) => d.link)) {
  type Release = { assets?: { name: string; browser_download_url: string }[] }
  fetch(`${repoApi}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  })
    .then((res) => (res.ok ? (res.json() as Promise<Release>) : null))
    .then((release) => {
      const assets = release?.assets ?? []
      for (const { link, suffix } of downloads) {
        const asset = assets.find((a) => a.name.endsWith(suffix))
        if (link && asset) link.href = asset.browser_download_url
      }
    })
    .catch(() => {})
}
