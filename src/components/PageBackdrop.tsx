import { DarkGradientBg } from './ui/elegant-dark-pattern'
import { APP_COLUMN_CLASS, BOOKING_FORM_COLUMN_CLASS } from './mcq/mcqLayout'

export const ANTHRO_PAGE_BACKGROUND =
  'radial-gradient(433.27% 292.54% at -93.97% -55.77%, rgba(74, 222, 128, 0.90) 0%, #0D0616 55.42%)'

/** Booking (step 1) uses the dark gradient. Questionnaire (step 2) uses SVG wallpapers. */
export function PageBackdrop({
  children,
  wide,
  wallpaperSrc,
  cssWallpaper,
}: {
  children: React.ReactNode
  /** Use the wider laptop column (booking form only). */
  wide?: boolean
  /** Wallpaper for questionnaire / assessment screens. */
  wallpaperSrc?: string
  /** CSS background that replaces the SVG wallpaper (Anthropometry). */
  cssWallpaper?: string
}) {
  const columnClass = wide ? BOOKING_FORM_COLUMN_CLASS : APP_COLUMN_CLASS
  const hasWallpaper = Boolean(cssWallpaper || wallpaperSrc)

  return (
    <DarkGradientBg className="font-sans text-white">
      {cssWallpaper ? (
        <div
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={{ background: cssWallpaper }}
          aria-hidden
        />
      ) : wallpaperSrc ? (
        <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden>
          <img src={wallpaperSrc} alt="" className="size-full object-cover object-top" />
        </div>
      ) : null}
      <div className={`relative h-full ${columnClass} ${hasWallpaper ? 'overflow-hidden' : ''}`}>
        {cssWallpaper ? (
          <div
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{ background: cssWallpaper }}
            aria-hidden
          />
        ) : wallpaperSrc ? (
          <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
            <img src={wallpaperSrc} alt="" className="size-full object-cover object-top" />
          </div>
        ) : null}
        <div className="relative z-[1] h-full">{children}</div>
      </div>
    </DarkGradientBg>
  )
}
