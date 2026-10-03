import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAvatarUrl } from "./use-avatar-url"

const query = vi.hoisted(() => ({
  options: null as null | { enabled: boolean; queryFn: () => Promise<string> },
  data: undefined as string | undefined,
}))

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: typeof query.options) => {
    query.options = options
    return { data: query.options?.enabled ? query.data : undefined }
  },
}))

vi.mock("@doska/core", () => ({
  activeStorage: () => ({
    url: (_scope: string, key: string) => Promise.resolve(`/api/files/${key}`),
  }),
}))

vi.mock("@/lib/platform", () => ({ isDesktop: () => false }))

describe("useAvatarUrl", () => {
  beforeEach(() => {
    query.options = null
    query.data = undefined
  })

  it("passes an SSO provider's absolute URL straight through", () => {
    const picture = "https://idp.example.com/u/42.jpg"
    expect(useAvatarUrl(picture)).toBe(picture)
    expect(query.options?.enabled).toBe(false)
  })

  it("resolves an uploaded file key through storage", async () => {
    query.data = "/api/files/abc.png"
    expect(useAvatarUrl("abc.png")).toBe("/api/files/abc.png")
    expect(query.options?.enabled).toBe(true)
    await expect(query.options?.queryFn()).resolves.toBe("/api/files/abc.png")
  })

  it("is null while a file key is still resolving", () => {
    expect(useAvatarUrl("abc.png")).toBeNull()
  })

  it("is null with no image", () => {
    expect(useAvatarUrl(null)).toBeNull()
    expect(query.options?.enabled).toBe(false)
  })
})
