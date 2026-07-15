/** Centered MCQ completion track + fill (Family / Lifestyle / Nutrition). */
export function McqProgressBar({
  percent,
  trackSrc,
  fillSrc,
}: {
  percent: number
  trackSrc: string
  fillSrc: string
}) {
  const width = `${Math.min(100, Math.max(0, percent))}%`

  return (
    <div className="relative h-6 w-full">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
        <img src={trackSrc} alt="" className="block h-px w-full max-w-none" aria-hidden />
      </div>
      <div
        className="absolute left-px top-1/2 -translate-y-1/2 transition-[width] duration-300 ease-out"
        style={{ width }}
      >
        <div className="relative h-0.5">
          <div className="absolute inset-y-[-10px] -left-[6%] -right-[6%]">
            <img src={fillSrc} alt="" className="block size-full max-w-none" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  )
}
