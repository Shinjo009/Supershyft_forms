import backgroundMobileSvg from '../assets/Background (1).svg'
import { APP_COLUMN_CLASS } from './mcq/mcqLayout'

/** Full-viewport background — same Figma mobile wallpaper at all breakpoints */
export function PageBackdrop({
  children,
  mobileBackgroundSrc,
}: {
  children: React.ReactNode
  /** Override the default wallpaper (e.g. Health Assessment screen) */
  mobileBackgroundSrc?: string
}) {
  const mobileBg = mobileBackgroundSrc ?? backgroundMobileSvg

  return (
    <div className="relative h-svh overflow-hidden bg-[#0d0616] font-sans text-white">
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <img
          src={mobileBg}
          alt=""
          className="size-full object-cover object-top"
        />
      </div>
      <div className={`relative z-[1] ${APP_COLUMN_CLASS}`}>{children}</div>
    </div>
  )
}
