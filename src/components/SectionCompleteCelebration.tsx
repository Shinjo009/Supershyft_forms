import { useEffect, useRef } from 'react'
import sheetUrl from '../assets/celebration/sheet.png'
import lastFrameUrl from '../assets/celebration/last.png'
import meta from '../assets/celebration/meta.json'
import './sectionCompleteCelebration.css'

type CelebrationTone = 'family' | 'lifestyle' | 'nutrition' | 'booking'

/**
 * Pixel-perfect celebration from `just gif.gif` (53 frames @ 100ms).
 * Labels: SUCCESS / Family / Lifestyle / Nutrition.
 * Plays once, then holds the final frame.
 * Black GIF background is keyed out to true transparency.
 */
export function SectionCompleteCelebration({
  tone = 'booking',
}: {
  tone?: CelebrationTone
  /** @deprecated ignored */
  compact?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const { frameCount, durationMs, frameW, frameH, cols } = meta
    let raf = 0
    let cancelled = false
    let started = false
    let currentFrame = 0

    const sheet = new Image()
    sheet.decoding = 'async'
    sheet.src = sheetUrl

    const resize = () => {
      const cssW = wrap.clientWidth
      const cssH = (cssW / frameW) * frameH
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const drawFrame = (index: number) => {
      const i = Math.max(0, Math.min(frameCount - 1, index))
      const col = i % cols
      const row = Math.floor(i / cols)
      const cssW = wrap.clientWidth
      const cssH = (cssW / frameW) * frameH
      ctx.clearRect(0, 0, cssW, cssH)
      ctx.drawImage(
        sheet,
        col * frameW,
        row * frameH,
        frameW,
        frameH,
        0,
        0,
        cssW,
        cssH,
      )
    }

    const start = () => {
      if (started || cancelled) return
      started = true
      resize()
      const t0 = performance.now()
      const tick = (now: number) => {
        if (cancelled) return
        const elapsed = now - t0
        currentFrame = Math.min(frameCount - 1, Math.floor(elapsed / durationMs))
        drawFrame(currentFrame)
        if (currentFrame < frameCount - 1) {
          raf = requestAnimationFrame(tick)
        }
      }
      raf = requestAnimationFrame(tick)
    }

    const onResize = () => {
      if (!started) return
      resize()
      drawFrame(currentFrame)
    }

    sheet.onload = start
    if (sheet.complete && sheet.naturalWidth > 0) start()

    window.addEventListener('resize', onResize)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      sheet.onload = null
    }
  }, [])

  return (
    <div ref={wrapRef} className={`scc scc-${tone}`} aria-hidden>
      <canvas ref={canvasRef} className="scc-canvas" />
      <img className="scc-fallback" src={lastFrameUrl} alt="" draggable={false} />
    </div>
  )
}
