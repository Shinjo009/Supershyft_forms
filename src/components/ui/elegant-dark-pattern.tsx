import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BackdropTone = 'booking' | 'family' | 'lifestyle' | 'nutrition' | 'anthro' | 'finale'

interface DarkGradientBgProps {
  children?: ReactNode
  className?: string
  /** Section colour on desktop. Mobile always keeps the booking pattern (PNGs cover it). */
  tone?: BackdropTone
}

type ToneStyle = {
  wash: string
  streak: string
  glow: string
}

const TONES: Record<BackdropTone, ToneStyle> = {
  booking: {
    wash: 'radial-gradient(100% 100% at 0% 0%, rgb(46, 46, 46) 0%, rgb(0, 0, 0) 100%)',
    streak: 'linear-gradient(rgb(210, 255, 230) 0%, rgb(50, 215, 145) 28%, rgba(16, 140, 90, 0) 100%)',
    glow: 'radial-gradient(circle at top left, rgba(30, 41, 59, 0.2), transparent 55%)',
  },
  family: {
    wash: 'radial-gradient(120% 120% at 0% 0%, #2D134D 0%, #0D0616 56%, #000000 100%)',
    streak: 'linear-gradient(rgb(235, 210, 255) 0%, rgb(157, 80, 187) 28%, rgba(45, 19, 77, 0) 100%)',
    glow: 'radial-gradient(circle at top left, rgba(157, 80, 187, 0.35), transparent 55%)',
  },
  lifestyle: {
    wash: 'radial-gradient(140% 140% at 0% 0%, #EE8B48 0%, #0D0616 59%, #000000 100%)',
    streak: 'linear-gradient(rgb(255, 232, 210) 0%, rgb(238, 139, 72) 28%, rgba(238, 139, 72, 0) 100%)',
    glow: 'radial-gradient(circle at top left, rgba(238, 139, 72, 0.4), transparent 55%)',
  },
  nutrition: {
    wash: 'radial-gradient(140% 140% at 0% 0%, rgba(63, 156, 255, 0.85) 0%, #0D0616 55%, #000000 100%)',
    streak: 'linear-gradient(rgb(210, 240, 255) 0%, rgb(63, 156, 255) 28%, rgba(18, 227, 255, 0) 100%)',
    glow: 'radial-gradient(circle at top left, rgba(63, 156, 255, 0.4), transparent 55%)',
  },
  anthro: {
    wash: 'radial-gradient(140% 140% at 0% 0%, rgba(74, 222, 128, 0.9) 0%, #0D0616 55%, #000000 100%)',
    streak: 'linear-gradient(rgb(210, 255, 230) 0%, rgb(74, 222, 128) 28%, rgba(16, 140, 90, 0) 100%)',
    glow: 'radial-gradient(circle at top left, rgba(74, 222, 128, 0.35), transparent 55%)',
  },
  finale: {
    wash: 'radial-gradient(140% 140% at 0% 0%, #FF3F9F 0%, #0D0616 57%, #000000 100%)',
    streak: 'linear-gradient(rgb(255, 210, 235) 0%, rgb(255, 63, 159) 28%, rgba(255, 63, 159, 0) 100%)',
    glow: 'radial-gradient(circle at top left, rgba(255, 63, 159, 0.4), transparent 55%)',
  },
}

const STREAK_MASKS = [
  'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 20%, rgba(0, 0, 0, 0) 36%, rgb(0, 0, 0) 55%, rgba(0, 0, 0, 0.13) 67%, rgb(0, 0, 0) 78%, rgba(0, 0, 0, 0) 97%)',
  'linear-gradient(90deg, rgba(0, 0, 0, 0) 11%, rgb(0, 0, 0) 25%, rgba(0, 0, 0, 0.55) 41%, rgba(0, 0, 0, 0.13) 67%, rgb(0, 0, 0) 78%, rgba(0, 0, 0, 0) 97%)',
  'linear-gradient(90deg, rgba(0, 0, 0, 0) 9%, rgb(0, 0, 0) 20%, rgba(0, 0, 0, 0.55) 28%, rgba(0, 0, 0, 0.424) 40%, rgb(0, 0, 0) 48%, rgba(0, 0, 0, 0.267) 54%, rgba(0, 0, 0, 0.13) 78%, rgb(0, 0, 0) 88%, rgba(0, 0, 0, 0) 97%)',
  'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 17%, rgba(0, 0, 0, 0.55) 26%, rgb(0, 0, 0) 35%, rgba(0, 0, 0, 0) 47%, rgba(0, 0, 0, 0.13) 69%, rgb(0, 0, 0) 79%, rgba(0, 0, 0, 0) 97%)',
  'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 20%, rgba(0, 0, 0, 0.55) 27%, rgb(0, 0, 0) 42%, rgba(0, 0, 0, 0) 48%, rgba(0, 0, 0, 0.13) 67%, rgb(0, 0, 0) 74%, rgb(0, 0, 0) 82%, rgba(0, 0, 0, 0.47) 88%, rgba(0, 0, 0, 0) 97%)',
] as const

const WASH_MASK =
  'radial-gradient(125% 100% at 0% 0%, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.224) 88.2883%, rgba(0, 0, 0, 0) 100%)'

function PatternLayers({ palette }: { palette: ToneStyle }) {
  const streakStyle = {
    background: palette.streak,
    transform: 'skewX(45deg)',
  } as const

  return (
    <>
      <div
        className="absolute inset-0 opacity-100"
        style={{
          background: palette.wash,
          mask: WASH_MASK,
          WebkitMask: WASH_MASK,
        }}
      >
        {STREAK_MASKS.map((mask) => (
          <div
            key={mask}
            className="absolute inset-0 opacity-20"
            style={{
              ...streakStyle,
              mask,
              WebkitMask: mask,
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 bg-repeat opacity-5"
        style={{
          backgroundImage:
            'url("https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png")',
          backgroundSize: '149.76px',
        }}
      />

      <div className="absolute inset-0" style={{ background: palette.glow }} />
    </>
  )
}

export function DarkGradientBg({ children, className, tone = 'booking' }: DarkGradientBgProps) {
  const themed = tone !== 'booking'

  return (
    <div className={cn('relative h-svh w-full overflow-hidden bg-black', className)}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <PatternLayers palette={TONES.booking} />
      </div>

      {themed ? (
        <div className="pointer-events-none absolute inset-0 hidden bg-black lg:block" aria-hidden>
          <PatternLayers palette={TONES[tone]} />
        </div>
      ) : null}

      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}
