import { DarkGradientBg } from './ui/elegant-dark-pattern'
import { APP_COLUMN_CLASS, BOOKING_FORM_COLUMN_CLASS } from './mcq/mcqLayout'

/** Full-viewport dark gradient background for every booking screen. */
export function PageBackdrop({
  children,
  wide,
}: {
  children: React.ReactNode
  /** Use the wider laptop column (booking form only). */
  wide?: boolean
}) {
  return (
    <DarkGradientBg className="font-sans text-white">
      <div className={`h-full ${wide ? BOOKING_FORM_COLUMN_CLASS : APP_COLUMN_CLASS}`}>
        {children}
      </div>
    </DarkGradientBg>
  )
}
