import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as avatarApi from "../../api/avatar"
import { keys } from "../keys"

/** `null` removes the avatar. */
export function useSetAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File | null) => {
      if (!file) return avatarApi.removeAvatar()
      await avatarApi.setAvatar(file)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.session })
      void qc.invalidateQueries({ queryKey: ["members"] })
      void qc.invalidateQueries({ queryKey: keys.directory })
      void qc.invalidateQueries({ queryKey: keys.accounts })
    },
  })
}
