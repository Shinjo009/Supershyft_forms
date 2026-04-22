import backgroundImage from '../assets/Background.jpg'

/** Full-viewport background image (mobile + desktop); light scrim keeps form text readable */
export function PageBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-x-hidden font-sans text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-black/[0.06]"
        aria-hidden
      />
      <div className="relative z-[1] min-h-svh">{children}</div>
    </div>
  )
}
