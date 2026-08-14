"use client"

import { useEffect, useRef } from "react"

/**
 * A compact purple LED bar-light equalizer, sized to fill its parent box.
 * Rendered behind the portal logo to echo the animated bars on the homepage
 * hero. Purely decorative — hidden from screen readers.
 */
export function LogoLedBars() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const prefersReduced =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const BAR_W = 4
    const GAP = 4
    const step = BAR_W + GAP
    let raf = 0

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height)
      const count = Math.ceil(width / step) + 1
      const time = t * 0.001

      for (let i = 0; i < count; i++) {
        const x = i * step
        // Layered sine waves give an audio-reactive equalizer feel.
        const wave =
          Math.sin(time * 1.6 + i * 0.55) * 0.5 +
          Math.sin(time * 3.1 + i * 0.9) * 0.3 +
          Math.sin(time * 0.7 + i * 0.2) * 0.2
        const norm = (wave + 1) / 2 // 0..1
        const minH = height * 0.18
        const barH = prefersReduced ? height * 0.45 : minH + norm * (height * 0.82 - minH)
        const y = height - barH

        const grad = ctx.createLinearGradient(0, height, 0, y)
        grad.addColorStop(0, "rgba(140, 82, 255, 0.95)")
        grad.addColorStop(1, "rgba(140, 82, 255, 0.12)")
        ctx.fillStyle = grad
        ctx.shadowColor = "rgba(140, 82, 255, 0.8)"
        ctx.shadowBlur = 8
        ctx.fillRect(x, y, BAR_W, barH)
      }
      ctx.shadowBlur = 0

      if (!prefersReduced) raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
}
