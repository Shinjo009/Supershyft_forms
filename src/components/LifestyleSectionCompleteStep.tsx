import assessmentCoinImg from '../assets/figma/assessment-coin.png'
import coinsCelebrationGif from '../assets/figma/coins-celebration.gif'
import tickCircleSolid from '../assets/figma/tick-circle-solid.svg'
import assessmentRadioImg from '../assets/Ellipse 13077.svg'
import majesticonsCoins from '../assets/majesticons_coins-line.svg'

function BalanceBadge({ balance = 170 }: { balance?: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-2 py-1">
      <img src={majesticonsCoins} alt="" className="size-4" aria-hidden />
      <span className="text-[12px] font-semibold text-[#90df9e]">Balance {balance}</span>
    </div>
  )
}

function CoinReward({
  label,
  tone = 'muted',
}: {
  label: string
  tone?: 'muted' | 'earned'
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <div className="relative size-3.5 overflow-hidden">
        <img
          src={assessmentCoinImg}
          alt=""
          className="absolute -left-[18.75%] -top-[18.75%] size-[137.5%] max-w-none"
          aria-hidden
        />
      </div>
      <span
        className={[
          'text-[10px] font-medium uppercase tracking-[0.5px]',
          tone === 'earned' ? 'text-[#90df9e]' : 'text-[#9a9a9a]',
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  )
}

/** Figma 5746:8771 — Lifestyle & Habits section complete */
export function LifestyleSectionCompleteStep({
  balance = 170,
  onStartNutrition,
}: {
  balance?: number
  onStartNutrition?: () => void
}) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col pb-6">
      <div className="flex shrink-0 items-end justify-end px-5 pb-[30px] pt-5">
        <BalanceBadge balance={balance} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-11 overflow-y-auto px-6">
        <div className="flex flex-col items-center">
          <img
            src={coinsCelebrationGif}
            alt=""
            className="pointer-events-none mb-[-14px] h-[188px] w-[266px] object-contain"
            aria-hidden
          />
          <div className="flex flex-col items-center gap-2.5">
            <div className="flex items-center justify-center gap-1 rounded-full border border-white/5 bg-[rgba(144,223,158,0.1)] px-3 py-0">
              <img src={majesticonsCoins} alt="" className="size-4" aria-hidden />
              <span className="text-[12px] font-medium leading-[22.5px] text-[#90df9e]">
                +70 SuperCoins
              </span>
              <span className="text-[12px] font-medium leading-[22.5px] text-[#e4e4e4]">
                earned
              </span>
            </div>
            <div className="flex flex-col items-center pb-3">
              <h2 className="text-center text-[18px] font-semibold tracking-[0.2px] text-white">
                Lifestyle Section Complete!
              </h2>
              <p className="mt-0 text-center text-[12px] leading-4 text-[#9a9a9a]">
                Only 1 more section left
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-[294px] flex-col gap-[18px]">
          <div className="flex w-full items-center justify-between rounded-xl border border-[rgba(218,193,90,0.5)] bg-white/5 p-4 shadow-[0_0_5px_0_rgba(218,193,90,0.2)]">
            <div className="flex min-w-0 items-center gap-1.5">
              <img src={tickCircleSolid} alt="" className="size-[15px] shrink-0" aria-hidden />
              <span className="text-[14px] font-medium text-white">Family History</span>
            </div>
            <CoinReward label="+50 COINS" tone="earned" />
          </div>

          <div className="flex w-full items-center justify-between rounded-xl border border-[rgba(218,193,90,0.5)] bg-white/5 p-4 shadow-[0_0_5px_0_rgba(218,193,90,0.2)]">
            <div className="flex min-w-0 items-center gap-1.5">
              <img src={tickCircleSolid} alt="" className="size-[15px] shrink-0" aria-hidden />
              <span className="text-[14px] font-medium text-white">Lifestyle & Habits</span>
            </div>
            <CoinReward label="+70 COINS" tone="earned" />
          </div>

          <button
            type="button"
            onClick={onStartNutrition}
            className="flex w-full flex-col gap-4 rounded-xl border border-[rgba(144,223,158,0.5)] bg-white/5 p-4 text-left shadow-[0_0_10px_0_rgba(144,223,158,0.5)]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-1.5">
                <img src={assessmentRadioImg} alt="" className="size-[15px] shrink-0" aria-hidden />
                <span className="text-[14px] font-medium text-[#ccc]">Nutrition Log</span>
              </div>
              <CoinReward label="+80 COINS" />
            </div>
            <p className="text-[11px] font-normal leading-normal text-[#9a9a9a]">
              Knowing your family&apos;s health patterns helps us predict risks more accurately.
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
