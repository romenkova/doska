import { useQuery } from "@tanstack/react-query"
import { activeStorage } from "@doska/core"
import { isDesktop } from "@/lib/platform"

const isUrl = (image: string) => /^(https?:\/\/|data:)/.test(image)

function resolve(key: string): Promise<string> {
  return isDesktop()
    ? activeStorage()
        .get("avatar", key)
        .then((blob) => URL.createObjectURL(blob))
    : activeStorage().url("avatar", key)
}

export function useAvatarUrl(image: string | null): string | null {
  const isKey = !!image && !isUrl(image)
  const { data } = useQuery({
    queryKey: ["avatar", image],
    queryFn: () => resolve(image!),
    enabled: isKey,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  if (!image) return null
  return isKey ? (data ?? null) : image
}
