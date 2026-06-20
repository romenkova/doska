import { useSession } from "@/lib/data/queries"

export function useAuth(): { authed: boolean | null; login: string | null } {
  const { data } = useSession()
  return {
    authed: data === undefined ? null : data.authed,
    login: data?.login ?? null,
  }
}
