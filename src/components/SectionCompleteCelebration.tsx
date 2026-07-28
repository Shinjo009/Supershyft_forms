import type { CSSProperties } from 'react'
import './sectionCompleteCelebration.css'

type CelebrationTone = 'family' | 'lifestyle' | 'nutrition' | 'booking'

const TONE_VARS: Record<CelebrationTone, { accent: string; soft: string; glow: string }> = {
  family: { accent: '#d8b4fe', soft: 'rgba(192,132,252,0.5)', glow: 'rgba(192,132,252,0.35)' },
  lifestyle: { accent: '#fbbf24', soft: 'rgba(251,191,36,0.5)', glow: 'rgba(251,191,36,0.35)' },
  nutrition: { accent: '#7dd3fc', soft: 'rgba(125,211,252,0.5)', glow: 'rgba(125,211,252,0.35)' },
  booking: { accent: '#90df9e', soft: 'rgba(144,223,158,0.55)', glow: 'rgba(144,223,158,0.4)' },
}

const TONE_COPY: Record<
  CelebrationTone,
  { headline: string; milestones: [string, string, string] }
> = {
  booking: {
    headline: 'STEP 1 DONE',
    milestones: ['Booked', 'Confirmed', 'Ready'],
  },
  family: {
    headline: 'FAMILY DONE',
    milestones: ['History', 'Mapped', 'Cleared'],
  },
  lifestyle: {
    headline: 'LIFESTYLE DONE',
    milestones: ['Move', 'Rest', 'Balance'],
  },
  nutrition: {
    headline: 'NUTRITION DONE',
    milestones: ['Fuel', 'Choices', 'Logged'],
  },
}

const MILESTONE_DELAY = ['scc-delay-1', 'scc-delay-2', 'scc-delay-3'] as const

/** Tick angles in degrees; 0 = right, 90 = up (SVG). Sweep upper semicircle-ish from 200°→340°. */
const TICK_ANGLES = Array.from({ length: 25 }, (_, i) => 200 + (i * 140) / 24)

function PedalGlyph() {
  return (
    <svg viewBox="0 0 32 36" className="scc-pedal-glyph" aria-hidden>
      <rect
        x="7"
        y="4"
        width="18"
        height="26"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M11 11h10M11 16h10M11 21h10M11 26h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path d="M5 33h22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Clean success celebration — gauge, step headline, then milestone pedals.
 * Replaces the old coins GIF slot on section-complete screens.
 */
export function SectionCompleteCelebration({
  tone = 'family',
}: {
  tone?: CelebrationTone
  /** @deprecated ignored — single polished size for all screens */
  compact?: boolean
}) {
  const colors = TONE_VARS[tone]
  const copy = TONE_COPY[tone]
  const cx = 120
  const cy = 118
  const r = 88

  return (
    <div
      className="scc"
      style={
        {
          ['--scc-accent']: colors.accent,
          ['--scc-soft']: colors.soft,
          ['--scc-glow']: colors.glow,
        } as CSSProperties
      }
      aria-hidden
    >
      <div className="scc-stage">
        <div className="scc-aura" />

        <svg className="scc-gauge" viewBox="0 0 240 140" role="presentation">
          <defs>
            <filter id={`scc-glow-${tone}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dim base arc track */}
          <path
            className="scc-track"
            d={`M ${cx + r * Math.cos((200 * Math.PI) / 180)} ${cy + r * Math.sin((200 * Math.PI) / 180)}
                A ${r} ${r} 0 0 1 ${cx + r * Math.cos((340 * Math.PI) / 180)} ${cy + r * Math.sin((340 * Math.PI) / 180)}`}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {TICK_ANGLES.map((deg, i) => {
            const rad = (deg * Math.PI) / 180
            const major = i % 4 === 0
            const inner = major ? r - 14 : r - 9
            const outer = r
            const x1 = cx + inner * Math.cos(rad)
            const y1 = cy + inner * Math.sin(rad)
            const x2 = cx + outer * Math.cos(rad)
            const y2 = cy + outer * Math.sin(rad)
            return (
              <line
                key={deg}
                className={`scc-tick ${major ? 'scc-tick-major' : ''}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth={major ? 2.25 : 1.25}
                strokeLinecap="round"
                style={{ animationDelay: `${0.2 + (i / (TICK_ANGLES.length - 1)) * 1.1}s` }}
              />
            )
          })}

          {/* Progress arc that draws with the needle */}
          <path
            className="scc-progress"
            d={`M ${cx + r * Math.cos((200 * Math.PI) / 180)} ${cy + r * Math.sin((200 * Math.PI) / 180)}
                A ${r} ${r} 0 0 1 ${cx + r * Math.cos((340 * Math.PI) / 180)} ${cy + r * Math.sin((340 * Math.PI) / 180)}`}
            fill="none"
            stroke={colors.accent}
            strokeWidth="3"
            strokeLinecap="round"
            filter={`url(#scc-glow-${tone})`}
            pathLength={100}
          />

          <g
            className="scc-needle"
            style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'view-box' }}
          >
            <line
              x1={cx}
              y1={cy}
              x2={cx + (r - 18) * Math.cos((200 * Math.PI) / 180)}
              y2={cy + (r - 18) * Math.sin((200 * Math.PI) / 180)}
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter={`url(#scc-glow-${tone})`}
            />
            <circle cx={cx} cy={cy} r="5.5" fill="#fff" />
            <circle cx={cx} cy={cy} r="2.5" fill={colors.accent} />
          </g>
        </svg>

        <p className="scc-success">{copy.headline}</p>
      </div>

      <div className="scc-pedals">
        {copy.milestones.map((label, index) => (
          <div key={label} className={`scc-pedal ${MILESTONE_DELAY[index]}`}>
            <span className="scc-swoosh" />
            <div className="scc-pedal-icon">
              <PedalGlyph />
            </div>
            <span className="scc-pedal-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
