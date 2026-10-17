"use client"

import { useEffect, useRef } from "react"

export function SignaturePad({ onChange }: { onChange: (value: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    const context = canvas.getContext("2d")
    if (!context) return
    context.lineWidth = 2.4
    context.lineCap = "round"
    context.strokeStyle = "#0A2540"
  }, [])

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = ref.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  return (
    <div>
      <canvas
        ref={ref}
        aria-label="Signature"
        className="h-28 w-full touch-none rounded-xl border border-navy/20 bg-white"
        onPointerDown={(event) => {
          const canvas = ref.current
          const context = canvas?.getContext("2d")
          if (!context) return
          drawing.current = true
          canvas?.setPointerCapture(event.pointerId)
          const start = point(event)
          context.beginPath()
          context.moveTo(start.x, start.y)
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return
          const context = ref.current?.getContext("2d")
          if (!context) return
          const next = point(event)
          context.lineTo(next.x, next.y)
          context.stroke()
        }}
        onPointerUp={() => {
          drawing.current = false
          onChange(ref.current?.toDataURL("image/png") || null)
        }}
      />
      <button
        type="button"
        className="mt-2 min-h-12 text-sm font-semibold text-teal-600"
        onClick={() => {
          const canvas = ref.current
          const context = canvas?.getContext("2d")
          if (!canvas || !context) return
          context.clearRect(0, 0, canvas.width, canvas.height)
          onChange(null)
        }}
      >
        Clear signature
      </button>
    </div>
  )
}
