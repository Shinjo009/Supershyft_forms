import backgroundImage from '../assets/bg.png'
import backgroundMobileSvg from '../assets/Background (1).svg'

/** Full-viewport background — mobile uses shared Figma SVG wallpaper */
export function PageBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-x-hidden bg-[#0d0616] font-sans text-white">
      <div className="pointer-events-none fixed inset-0 lg:hidden" aria-hidden>
        <img
          src={backgroundMobileSvg}
          alt=""
          className="size-full object-cover object-top"
        />
      </div>
      <div
        className="pointer-events-none fixed inset-0 hidden bg-cover bg-center bg-no-repeat lg:block"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        aria-hidden
      />
      <div className="relative z-[1] mx-auto min-h-svh w-full max-w-[360px]">{children}</div>
    </div>
  )
}
