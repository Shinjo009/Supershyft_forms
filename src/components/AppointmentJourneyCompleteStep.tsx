import coinsCelebrationGif from '../assets/figma/coins-celebration.gif'
import majesticonsCoins from '../assets/majesticons_coins-line.svg'
import { ContinueButton } from './ContinueButton'
import { SuperCoinsProgressRail } from './SuperCoinsProgressRail'

const TOTAL_SUPERCOINS = 250

function formatBookingDisplayId(employeeId: string): string {
  const normalized = employeeId.trim().toUpperCase()
  if (!normalized) return 'XYZ 123'
  if (normalized.startsWith('HRM') && normalized.length > 3) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3)}`
  }
  return normalized
}

/** Figma 5657:51356 — final appointment + assessment journey complete */
export function AppointmentJourneyCompleteStep({
  bookingId = 'XYZ 123',
  onDownloadApp,
}: {
  bookingId?: string
  onDownloadApp?: () => void
}) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col pb-6 pt-[84px]">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6">
        <div className="flex w-full max-w-[312px] flex-col items-center gap-6">
          <div className="flex flex-col items-center">
            <img
              src={coinsCelebrationGif}
              alt=""
              className="pointer-events-none mb-[-14px] h-[188px] w-[266px] border-0 object-contain outline-none"
              aria-hidden
            />
            <div className="flex items-center justify-center gap-1 rounded-full border border-white/5 bg-[rgba(144,223,158,0.1)] px-3 py-0">
              <img src={majesticonsCoins} alt="" className="size-4" aria-hidden />
              <span className="text-[12px] font-medium leading-[22.5px] text-[#90df9e]">
                +250 SuperCoins
              </span>
              <span className="text-[12px] font-medium leading-[22.5px] text-[#e4e4e4]">
                earned
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-6 overflow-visible rounded-[12px] border border-white/10 bg-white/5 p-[13px] backdrop-blur-[12px]">
            <h2 className="text-center text-[14px] font-semibold text-white">
              Appointment Booking Confirmed
            </h2>

            <div className="flex w-full flex-col items-center gap-1.5 px-1.5 text-center">
              <p className="text-[11px] leading-[15px] text-[#9a9a9a]">Booking ID</p>
              <p className="text-[24px] font-extrabold leading-8 tracking-[4px] text-[#90df9e]">
                {formatBookingDisplayId(bookingId)}
              </p>
            </div>

            <div className="h-px w-[252px] bg-white/10" />

            <SuperCoinsProgressRail
              embedded
              earnedCoins={TOTAL_SUPERCOINS}
              totalCoins={TOTAL_SUPERCOINS}
            />

            <p className="text-center text-[12px] font-light leading-normal text-white">
              Get the Supershyft app for complete details
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-[312px] shrink-0 flex-col items-center gap-1.5 px-6">
        <ContinueButton
          variant="mobileBar"
          className="h-[52px] w-full shadow-[0_12px_10px_rgba(255,255,255,0.15)]"
          showChevron={false}
          onClick={onDownloadApp}
        >
          Download the App
        </ContinueButton>
        <p className="text-center text-[14px] font-medium leading-[22.5px] text-[#999]">OR</p>
        <p className="text-center text-[11px] font-medium leading-[22.5px] text-[#999]">
          We will get in touch with you on Whatsapp/ Email
        </p>
      </div>
    </div>
  )
}
