import { type Session, useSession } from "@doska/core"

export function useAuth(): Omit<Session, "authed"> & {
  authed: boolean | null
} {
  const { data } = useSession()
  return {
    authed: data === undefined ? null : data.authed,
    login: data?.login ?? null,
    userId: data?.userId ?? null,
    image: data?.image ?? null,
    isAdmin: data?.isAdmin ?? false,
  }
}
