import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  desktop: true,
  fullscreen: false,
  setFullscreen: vi.fn(),
}))

vi.mock("./platform", () => ({ isDesktop: () => state.desktop }))

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: () => ({
    isFullscreen: () => Promise.resolve(state.fullscreen),
    setFullscreen: state.setFullscreen,
  }),
}))

type KeyHandler = (e: {
  key: string
  repeat: boolean
  preventDefault: () => void
}) => void

let handlers: KeyHandler[]

function boot(userAgent: string) {
  handlers = []
  vi.stubGlobal("navigator", { userAgent })
  vi.stubGlobal("window", {
    addEventListener: (_type: string, handler: KeyHandler) =>
      handlers.push(handler),
  })
}

function press(key: string, repeat = false) {
  const preventDefault = vi.fn()
  for (const handler of handlers) handler({ key, repeat, preventDefault })
  return preventDefault
}

async function init() {
  vi.resetModules()
  const { initFullscreen } = await import("./fullscreen")
  initFullscreen()
}

describe("initFullscreen", () => {
  beforeEach(() => {
    state.desktop = true
    state.fullscreen = false
    state.setFullscreen.mockReset()
  })

  it("F11 flips fullscreen on Windows and Linux", async () => {
    boot("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    await init()

    const preventDefault = press("F11")
    expect(preventDefault).toHaveBeenCalled()
    await vi.waitFor(() =>
      expect(state.setFullscreen).toHaveBeenCalledWith(true)
    )

    state.fullscreen = true
    press("F11")
    await vi.waitFor(() =>
      expect(state.setFullscreen).toHaveBeenLastCalledWith(false)
    )
  })

  it("ignores a held-down F11 and other keys", async () => {
    boot("Mozilla/5.0 (X11; Linux x86_64)")
    await init()

    press("F11", true)
    press("F10")
    await new Promise((r) => setTimeout(r, 0))
    expect(state.setFullscreen).not.toHaveBeenCalled()
  })

  it("leaves macOS and the web alone", async () => {
    boot("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
    await init()
    expect(handlers).toHaveLength(0)

    state.desktop = false
    boot("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    await init()
    expect(handlers).toHaveLength(0)
  })
})
