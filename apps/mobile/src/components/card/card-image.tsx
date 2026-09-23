import { runtime } from "@doska/core"
import { apiUrl } from "@doska/core/server"
import type { SoleImage } from "@doska/markdown"
import { useState } from "react"
import { Image, type ImageURISource } from "react-native"

function sourceOf(image: SoleImage): ImageURISource {
  if (image.source.kind === "url") return { uri: image.source.url }
  const token = runtime().auth.token()
  return {
    uri: apiUrl(`/api/files/${encodeURIComponent(image.source.key)}`),
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  }
}

/** Full card width, at the image's own proportions once it loads. */
export function CardImage({ image }: { image: SoleImage }) {
  const [ratio, setRatio] = useState(4 / 3)

  return (
    <Image
      source={sourceOf(image)}
      accessibilityLabel={image.alt}
      resizeMode="cover"
      onLoad={(e) => {
        const { width, height } = e.nativeEvent.source
        if (width && height) setRatio(width / height)
      }}
      style={{ width: "100%", aspectRatio: ratio }}
    />
  )
}
