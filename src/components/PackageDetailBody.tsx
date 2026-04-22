import { X } from 'lucide-react'
import type { HealthPackage } from '../data/packages'

type Props = {
  pkg: HealthPackage
  onClose?: () => void
  variant: 'mobile' | 'desktop'
}

export function PackageDetailBody({ pkg, onClose, variant }: Props) {
  const isMobile = variant === 'mobile'
  const [left, right] = pkg.bloodColumns

  return (
    <div
      className={[
        'relative rounded-xl border border-white/10 bg-white/5 p-6',
        isMobile ? 'mx-auto w-full max-w-[320px]' : 'w-full',
      ].join(' ')}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Close details"
        >
          <X className="size-5" />
        </button>
      )}

      <div className={isMobile ? 'flex flex-col gap-6' : 'flex flex-wrap items-start gap-8 lg:flex-nowrap'}>
        <div className={isMobile ? 'flex gap-5' : 'flex min-w-[180px] flex-1 flex-col items-center gap-6 text-center lg:items-start lg:text-left'}>
          <div className="flex size-16 items-center justify-center rounded-full bg-white/5 lg:size-[102px]">
            <pkg.Icon className="size-9 text-white/80 lg:size-14" strokeWidth={1.25} />
          </div>
          <div>
            <h3
              className={[
                'font-bold text-white',
                isMobile ? 'max-w-[140px] text-[15px] leading-snug' : 'max-w-[200px] text-lg lg:text-xl',
              ].join(' ')}
            >
              {pkg.lines ? (
                <>
                  {pkg.lines[0]}
                  <br />
                  {pkg.lines[1]}
                </>
              ) : (
                pkg.title
              )}
            </h3>
            {!isMobile && (
              <p className="mt-4 font-medium text-white/90">Total Value: {pkg.price}</p>
            )}
          </div>
        </div>

        <div className={isMobile ? 'w-full space-y-3' : 'flex flex-1 flex-wrap gap-6 lg:gap-8'}>
          <section className={isMobile ? '' : 'min-w-[200px] flex-1'}>
            <h4 className="mb-3 text-center text-xs font-semibold text-white lg:text-left lg:text-[15px]">
              Bio-AI Insights Covered
            </h4>
            <ul className="space-y-2">
              {pkg.bioAi.map((item) => (
                <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-[#9a9a9a] lg:text-[15px] lg:text-[#ccc]">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#4b8d83] lg:size-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {!isMobile && (
            <div className="hidden w-px self-stretch bg-gradient-to-b from-transparent via-[#4b8d83]/50 to-transparent lg:block" />
          )}

          {isMobile && (
            <div className="my-1 h-px w-full bg-gradient-to-r from-transparent via-[#4b8d83]/60 to-transparent" />
          )}

          <section className={isMobile ? '' : 'min-w-[220px] flex-1'}>
            <h4 className="mb-3 text-center text-xs font-semibold text-white lg:text-left lg:text-[15px]">
              Blood Markers Covered
            </h4>
            <div className={isMobile ? 'flex justify-between gap-4' : 'flex gap-6'}>
              <ul className="space-y-2">
                {left.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-[11px] leading-relaxed text-[#9a9a9a] lg:text-[15px] lg:text-[#ccc]"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#4b8d83] lg:size-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <ul className="space-y-2">
                {right.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-[11px] leading-relaxed text-[#9a9a9a] lg:text-[15px] lg:text-[#ccc]"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#4b8d83] lg:size-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>

      {isMobile && (
        <p className="mt-6 text-center text-[15px] font-bold text-white">Total Value: {pkg.price}</p>
      )}
    </div>
  )
}
