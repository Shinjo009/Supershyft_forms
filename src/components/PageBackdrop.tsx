import backgroundImage from '../assets/bg.png'

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
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(55%_70%_at_100%_0%,rgba(47,132,116,0.38)_0%,rgba(5,9,12,0)_72%),radial-gradient(40%_55%_at_0%_100%,rgba(42,104,92,0.22)_0%,rgba(5,9,12,0)_78%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-black/[0.16]"
        aria-hidden
      />
      <div className="relative z-[1] min-h-svh">{children}</div>
    </div>
  )
}
