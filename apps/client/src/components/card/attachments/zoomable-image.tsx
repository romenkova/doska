import { useEffect, useRef, useState } from "react"
import { cn } from "@doska/ui-kit"

const MIN_SCALE = 1
const MAX_SCALE = 8

interface IView {
  scale: number
  x: number
  y: number
}

const FIT: IView = { scale: 1, x: 0, y: 0 }

interface IProps {
  src: string
  alt: string
}

/** Wheel zooms toward the cursor, drag pans, double-click resets. */
export function ZoomableImage({ src, alt }: IProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const [view, setView] = useState<IView>(FIT)

  useEffect(() => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = container.getBoundingClientRect()
      const px = e.clientX - rect.left - img.offsetLeft
      const py = e.clientY - rect.top - img.offsetTop
      setView((prev) => {
        const scale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, prev.scale * Math.exp(-e.deltaY * 0.002))
        )
        if (scale === MIN_SCALE) return FIT
        const ratio = scale / prev.scale
        return {
          scale,
          x: px - (px - prev.x) * ratio,
          y: py - (py - prev.y) * ratio,
        }
      })
    }

    container.addEventListener("wheel", onWheel, { passive: false })
    return () => container.removeEventListener("wheel", onWheel)
  }, [])

  const zoomed = view.scale > MIN_SCALE

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-1 items-center justify-center overflow-hidden",
        zoomed && "cursor-grab active:cursor-grabbing"
      )}
      onPointerDown={(e) => {
        if (!zoomed) return
        e.currentTarget.setPointerCapture(e.pointerId)
        dragRef.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerMove={(e) => {
        const drag = dragRef.current
        if (!drag) return
        const dx = e.clientX - drag.x
        const dy = e.clientY - drag.y
        dragRef.current = { x: e.clientX, y: e.clientY }
        setView((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
      }}
      onPointerUp={() => {
        dragRef.current = null
      }}
      onDoubleClick={() => setView(FIT)}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        className="max-h-full max-w-full origin-top-left select-none"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
        }}
      />
    </div>
  )
}
