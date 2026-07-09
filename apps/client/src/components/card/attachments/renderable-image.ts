// Image mimes browsers can't decode in an <img>, so we show the file icon instead.
const UNRENDERABLE_IMAGE_MIMES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "image/tiff",
])

export function isRenderableImage(mime: string): boolean {
  return mime.startsWith("image/") && !UNRENDERABLE_IMAGE_MIMES.has(mime)
}
