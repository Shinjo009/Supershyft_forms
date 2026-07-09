import { ContinueButton } from './ContinueButton'
import assessmentRadioImg from '../assets/Ellipse 13077.svg'
import hourglassIcon from '../assets/Group.svg'
import unlockCoinsIcon from '../assets/majesticons_coins-line.svg'
import heartRateIcon from '../assets/streamline-flex_heart-rate.svg'
import unlockInsightsIcon from '../assets/SVG.svg'
import assessmentCoinImg from '../assets/figma/assessment-coin.png'

const ASSESSMENT_SECTIONS = [
  {
    id: 'family',
    title: 'Family History',
    coins: '+50 COINS',
    description:
      "Knowing your family's health patterns helps us predict risks more accurately.",
    featured: true,
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle & Habits',
    coins: '+70 COINS',
    featured: false,
  },
  {
    id: 'nutrition',
    title: 'Nutrition Log',
    coins: '+80 COINS',
    featured: false,
  },
] as const

function BalanceBadge({ balance = 50 }: { balance?: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-2 py-1">
      <CoinsLineIcon />
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
      <span className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#9a9a9a]">
        {label}
      </span>
    </div>
  )
}

function AssessmentCard({
  title,
  coins,
  description,
  featured,
}: {
  title: string
  coins: string
  description?: string
  featured: boolean
}) {
  if (featured) {
    return (
      <div className="flex w-full flex-col gap-4 rounded-xl border border-[rgba(144,223,158,0.5)] bg-white/5 p-4 shadow-[0_0_10px_0_rgba(144,223,158,0.5)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-1.5">
            <img src={assessmentRadioImg} alt="" className="size-[15px] shrink-0" aria-hidden />
            <span className="text-[14px] font-medium text-[#ccc]">{title}</span>
          </div>
          <CoinReward label={coins} />
        </div>
        {description ? (
          <p className="text-[11px] font-normal leading-normal text-[#9a9a9a]">{description}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex w-full items-center justify-between rounded-xl bg-white/5 p-[15px]">
      <div className="flex min-w-0 items-center gap-1.5">
        <img src={assessmentRadioImg} alt="" className="size-[15px] shrink-0" aria-hidden />
        <span className="text-[14px] font-medium text-[#ccc]">{title}</span>
      </div>
      <CoinReward label={coins} />
    </div>
  )
}

function UnlockRow({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 p-[3px]">
        <img src={icon} alt="" className="size-7 object-contain" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-[#9a9a9a]">{label}</p>
        <p className="text-[14px] font-medium text-[#ccc]">{value}</p>
      </div>
    </div>
  )
}

/** Figma node 5768:10896 — Health Assessment intro after booking confirmed */
export function HealthAssessmentStep({
  balance = 50,
  onStartAssessment,
}: {
  balance?: number
  onStartAssessment?: () => void
}) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col pb-6">
      <div className="flex shrink-0 items-end justify-end px-5 pb-[30px] pt-5">
        <BalanceBadge balance={balance} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto px-6">
        <div className="flex w-full flex-col items-center">
          <div className="mb-6 flex size-14 items-center justify-center rounded-xl border border-[rgba(144,223,158,0.5)] p-px shadow-[0_4px_12px_0_rgba(16,185,129,0.1)]">
            <img src={heartRateIcon} alt="" className="size-7" aria-hidden />
          </div>

          <div className="flex w-full flex-col items-center pb-3">
            <h2 className="text-center text-[18px] font-semibold tracking-[0.2px] text-white">
              Health Assessment
            </h2>
            <p className="mt-1.5 max-w-[312px] text-center text-[12px] leading-4 text-[#9a9a9a]">
              Help our Bio-AI create a more personalized view of your lifestyle and health risks.
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <img src={hourglassIcon} alt="" className="h-[11px] w-2.5" aria-hidden />
            <span className="text-[12px] text-[#90df9e]">Takes only 4 mins</span>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[294px] flex-col gap-[18px]">
          {ASSESSMENT_SECTIONS.map((section) => (
            <AssessmentCard
              key={section.id}
              title={section.title}
              coins={section.coins}
              description={'description' in section ? section.description : undefined}
              featured={section.featured}
            />
          ))}
        </div>

        <div className="flex w-full flex-col gap-3">
          <p className="text-center text-[14px] font-semibold leading-[22.5px] text-white">
            What you Unlock
          </p>
          <div className="flex w-full flex-col gap-5 rounded-lg border border-[rgba(144,223,158,0.2)] bg-[rgba(75,141,131,0.1)] p-[25px]">
            <UnlockRow icon={unlockCoinsIcon} label="Reward" value="+200 SuperCoins" />
            <UnlockRow
              icon={unlockInsightsIcon}
              label="Personalized"
              value="Accurate Health Insights"
            />
          </div>
        </div>

        <ContinueButton
          variant="mobileBar"
          className="w-full"
          showChevron={false}
          onClick={onStartAssessment}
        >
          Start Assessment
        </ContinueButton>
      </div>
    </div>
  )
}

function CoinsLineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.5" stroke="#90DF9E" strokeWidth="1.2" />
      <path d="M8 5.5V10.5M6.25 8H9.75" stroke="#90DF9E" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
