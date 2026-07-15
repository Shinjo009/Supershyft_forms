/** Centered MCQ completion track + fill (Family / Lifestyle / Nutrition). */
export function McqProgressBar({
  percent,
  color,
}: {
  percent: number
  /** Active fill color (matches each section’s progress SVG stroke). */
  color: string
}) {
  const width = `${Math.min(100, Math.max(0, percent))}%`

  return (
    <div className="relative flex h-6 w-full items-center">
      <div className="absolute inset-x-0 h-[2px] rounded-full bg-white/20" />
      <div
        className="absolute left-0 h-1 rounded-full transition-[width] duration-300 ease-out"
        style={{
          width,
          backgroundColor: color,
          boxShadow: `0 1px 10px ${color}66`,
        }}
      />
    </div>
  )
}
