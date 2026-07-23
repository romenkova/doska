import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as authApi from "@/lib/api/auth"
import { sync } from "@/lib/api/sync"
import { keys } from "../keys"

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ login, password }: { login: string; password: string }) =>
      authApi.login(login, password),
    onSuccess: (_data, { login }) => {
      qc.setQueryData(keys.session, { authed: true, login })
      // Now authorized — flush whatever queued up while signed out.
      void sync.reconcile()
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () =>
      qc.setQueryData(keys.session, { authed: false, login: null }),
  })
}
