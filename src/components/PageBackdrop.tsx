import { DarkGradientBg, type BackdropTone } from './ui/elegant-dark-pattern'
import { APP_COLUMN_CLASS, BOOKING_FORM_COLUMN_CLASS } from './mcq/mcqLayout'

export type { BackdropTone }

export const ANTHRO_PAGE_BACKGROUND =
  'radial-gradient(433.27% 292.54% at -93.97% -55.77%, rgba(74, 222, 128, 0.90) 0%, #0D0616 55.42%)'

/** Booking uses the dark gradient. Questionnaire PNGs stay on mobile; desktop uses CSS tones. */
export function PageBackdrop({
  children,
  wide,
  wallpaperSrc,
  cssWallpaper,
  tone = 'booking',
}: {
  children: React.ReactNode
  /** Use the wider laptop column (booking form only). */
  wide?: boolean
  /** PNG wallpaper — mobile only. */
  wallpaperSrc?: string
  /** CSS fallback on mobile when there is no PNG (Anthropometry). */
  cssWallpaper?: string
  /** Desktop questionnaire colour. Ignored on mobile. */
  tone?: BackdropTone
}) {
  const columnClass = wide ? BOOKING_FORM_COLUMN_CLASS : APP_COLUMN_CLASS
  const hasMobileWallpaper = Boolean(cssWallpaper || wallpaperSrc)

  return (
    <DarkGradientBg className="font-sans text-white" tone={tone}>
      {wallpaperSrc ? (
        <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden>
          <img src={wallpaperSrc} alt="" className="size-full object-cover object-top" />
        </div>
      ) : cssWallpaper ? (
        <div
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={{ background: cssWallpaper }}
          aria-hidden
        />
      ) : null}
      <div className={`relative h-full ${columnClass} ${hasMobileWallpaper ? 'overflow-hidden lg:overflow-visible' : ''}`}>
        <div className="relative z-[1] h-full">{children}</div>
      </div>
    </DarkGradientBg>
  )
}
