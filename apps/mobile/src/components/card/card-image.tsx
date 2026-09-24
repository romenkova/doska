import { runtime } from "@doska/core"
import { apiUrl } from "@doska/core/server"
import type { SoleImage } from "@doska/markdown"
import { useState } from "react"
import { Image, type ImageURISource, useWindowDimensions } from "react-native"

function sourceOf(image: SoleImage): ImageURISource {
  if (image.source.kind === "url") return { uri: image.source.url }
  const token = runtime().auth.token()
  return {
    uri: apiUrl(`/api/files/${encodeURIComponent(image.source.key)}`),
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  }
}

/** Full card width, at the image's own proportions once it loads, capped at half the screen. */
export function CardImage({ image }: { image: SoleImage }) {
  const [ratio, setRatio] = useState(4 / 3)
  const [cardWidth, setCardWidth] = useState(0)
  const { height: screenHeight } = useWindowDimensions()
  const maxHeight = screenHeight / 2

  return (
    <Image
      source={sourceOf(image)}
      accessibilityLabel={image.alt}
      resizeMode="cover"
      onLoad={(e) => {
        const { width, height } = e.nativeEvent.source
        if (width && height) setRatio(width / height)
      }}
      onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
      style={{ width: "100%", height: Math.min(cardWidth / ratio, maxHeight) }}
    />
  )
}
