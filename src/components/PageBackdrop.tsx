import { DarkGradientBg } from './ui/elegant-dark-pattern'
import { APP_COLUMN_CLASS, BOOKING_FORM_COLUMN_CLASS } from './mcq/mcqLayout'

/** Booking (step 1) uses the dark gradient. Questionnaire (step 2) uses SVG wallpapers. */
export function PageBackdrop({
  children,
  wide,
  wallpaperSrc,
}: {
  children: React.ReactNode
  /** Use the wider laptop column (booking form only). */
  wide?: boolean
  /** Wallpaper for questionnaire / assessment screens. */
  wallpaperSrc?: string
}) {
  const columnClass = wide ? BOOKING_FORM_COLUMN_CLASS : APP_COLUMN_CLASS

  return (
    <DarkGradientBg className="font-sans text-white">
      {wallpaperSrc ? (
        <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden>
          <img src={wallpaperSrc} alt="" className="size-full object-cover object-top" />
        </div>
      ) : null}
      <div className={`relative h-full ${columnClass} ${wallpaperSrc ? 'overflow-hidden' : ''}`}>
        {wallpaperSrc ? (
          <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
            <img src={wallpaperSrc} alt="" className="size-full object-cover object-top" />
          </div>
        ) : null}
        <div className="relative z-[1] h-full">{children}</div>
      </div>
    </DarkGradientBg>
  )
}
