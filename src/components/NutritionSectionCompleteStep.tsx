import assessmentCoinImg from '../assets/figma/assessment-coin.png'
import coinsCelebrationGif from '../assets/figma/coins-celebration.gif'
import tickCircleSolid from '../assets/figma/tick-circle-solid.svg'
import majesticonsCoins from '../assets/majesticons_coins-line.svg'
import { ContinueButton } from './ContinueButton'
import { ASSESSMENT_CARD_STACK_CLASS, ASSESSMENT_CONTENT_MAX_CLASS } from './mcq/mcqLayout'

function BalanceBadge({ balance = 200 }: { balance?: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-2 py-1">
      <img src={majesticonsCoins} alt="" className="size-4" aria-hidden />
      <span className="text-[12px] font-semibold text-[#90df9e]">Balance {balance}</span>
    </div>
  )
}

function CoinReward({ label }: { label: string }) {
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
      <span className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#90df9e]">
        {label}
      </span>
    </div>
  )
}

function CompletedSectionRow({ title, coins }: { title: string; coins: string }) {
  return (
    <div className="flex w-full items-center justify-between rounded-xl border border-[rgba(218,193,90,0.5)] bg-white/5 p-4 shadow-[0_0_5px_0_rgba(218,193,90,0.2)]">
      <div className="flex min-w-0 items-center gap-1.5">
        <img src={tickCircleSolid} alt="" className="size-[15px] shrink-0" aria-hidden />
        <span className="text-[14px] font-medium text-white">{title}</span>
      </div>
      <CoinReward label={coins} />
    </div>
  )
}

/** Figma 5657:51836 — Nutrition Log section complete */
export function NutritionSectionCompleteStep({
  balance = 200,
  onContinue,
}: {
  balance?: number
  onContinue?: () => void
}) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col pb-6">
      <div className="flex shrink-0 items-end justify-end px-5 pb-[30px] pt-5">
        <BalanceBadge balance={balance} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-11 overflow-y-auto px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                +80 SuperCoins
              </span>
              <span className="text-[12px] font-medium leading-[22.5px] text-[#e4e4e4]">
                earned
              </span>
            </div>
            <div className="flex flex-col items-center pb-3">
              <h2 className="text-center text-[18px] font-semibold tracking-[0.2px] text-white">
                Nutrition Section Complete!
              </h2>
            </div>
          </div>
        </div>

        <div className={ASSESSMENT_CARD_STACK_CLASS}>
          <CompletedSectionRow title="Family History" coins="+50 COINS" />
          <CompletedSectionRow title="Lifestyle & Habits" coins="+70 COINS" />
          <CompletedSectionRow title="Nutrition Log" coins="+80 COINS" />
        </div>

        {onContinue ? (
          <ContinueButton
            variant="mobileBar"
            className={`w-full ${ASSESSMENT_CONTENT_MAX_CLASS}`}
            showChevron={false}
            onClick={onContinue}
          >
            Continue
          </ContinueButton>
        ) : null}
      </div>
    </div>
  )
}
