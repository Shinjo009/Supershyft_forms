import coinProgressIcon from '../assets/Icon.svg'

/** Figma node 5488:8856 — Step 1 / Step 2 coin progress rail */
export function SuperCoinsProgressRail({
  earnedCoins = 50,
  totalCoins = 250,
  embedded = false,
}: {
  earnedCoins?: number
  totalCoins?: number
  embedded?: boolean
}) {
  const isComplete = earnedCoins >= totalCoins
  const progressPercent = Math.min(100, (earnedCoins / totalCoins) * 100)
  const coinLeft = `min(calc(100% - 32px), max(0px, calc(${progressPercent}% - 16px)))`

  const content = (
    <div className="flex w-full flex-col items-end">
      <div className="w-full">
        <div className="flex w-full items-center justify-between whitespace-nowrap">
          <div className="flex flex-col items-start justify-end gap-1">
            <p className="text-[16px] font-semibold leading-[22px] tracking-[-0.96px] text-white">
              Step 1
            </p>
            <p className="text-[11px] font-normal leading-[12px] text-[#90df9e]">Completed</p>
          </div>
          <div className="flex flex-col items-start justify-end gap-1">
            <p className="text-[16px] font-semibold leading-[22px] tracking-[-0.96px] text-white">
              Step 2
            </p>
            <p
              className={`text-[11px] font-normal leading-[12px] ${
                isComplete ? 'text-[#90df9e]' : 'text-[#9a9a9a]'
              }`}
            >
              {isComplete ? 'Completed' : 'Pending'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex h-9 w-full flex-col items-start overflow-visible pt-4">
        <div className="relative h-2 w-full shrink-0 overflow-visible rounded-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#dac15a]"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 flex -translate-y-1/2 flex-col items-start"
            style={{ left: coinLeft }}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-4 border-[#dac15a] bg-[#2a2a2a] p-1 shadow-[0_0_7.5px_#dac15a]">
              <img
                src={coinProgressIcon}
                alt=""
                className="size-[16.667px]"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>

      <p className="whitespace-nowrap text-[#9a9a9a]">
        <span className="text-[13px] font-semibold leading-[12px] text-[#90df9e]">
          {earnedCoins}{' '}
        </span>
        <span className="text-[11px] font-light leading-[12px]">/{totalCoins} coins</span>
      </p>
    </div>
  )

  if (embedded) return content

  return (
    <div className="w-full rounded-[12px] border border-white/10 bg-white/5 p-[13px] backdrop-blur-[12px]">
      {content}
    </div>
  )
}
