"use client"

import { useEffect, useRef } from "react"

export function AnimatedVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Visualizer bars
    const bars: Array<{ x: number; height: number; targetHeight: number; color: string }> = []
    const barCount = Math.floor(window.innerWidth / 20)

    for (let i = 0; i < barCount; i++) {
      // Create variations of the main purple color
      const hue = 270 + (i * 30) / barCount // Purple range around 270 degrees
      const saturation = 70 + (i * 20) / barCount // Vary saturation
      const lightness = 50 + (i * 20) / barCount // Vary lightness

      bars.push({
        x: (i * window.innerWidth) / barCount,
        height: 0,
        targetHeight: 0,
        color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      })
    }

    // Floating particles
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      alpha: number
    }> = []

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? "#8c52ff" : "#ffffff", // Your specific purple and white
        alpha: Math.random() * 0.5 + 0.3,
      })
    }

    let animationId: number

    const animate = () => {
      ctx.fillStyle = "rgba(15, 23, 42, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw bars
      bars.forEach((bar, index) => {
        // Simulate audio reactive behavior
        const time = Date.now() * 0.001
        const frequency = 0.5 + index * 0.1
        bar.targetHeight = (Math.sin(time * frequency) * 0.5 + 0.5) * 200 + 50

        // Smooth animation
        bar.height += (bar.targetHeight - bar.height) * 0.1

        // Draw bar with gradient using your specific purple
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - bar.height)
        gradient.addColorStop(0, "#8c52ff") // Your specific purple
        gradient.addColorStop(1, "rgba(140, 82, 255, 0.25)") // Same purple with alpha

        ctx.fillStyle = gradient
        ctx.fillRect(bar.x, canvas.height - bar.height, 15, bar.height)

        // Add glow effect with your purple
        ctx.shadowColor = "#8c52ff"
        ctx.shadowBlur = 20
        ctx.fillRect(bar.x, canvas.height - bar.height, 15, bar.height)
        ctx.shadowBlur = 0
      })

      // Update and draw particles
      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Draw particle
        ctx.globalAlpha = particle.alpha
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-60"
      style={{ background: "transparent" }}
    />
  )
}
