import bookingConfirmedCheck from '../assets/figma/booking-confirmed-check.svg'
import { ContinueButton } from './ContinueButton'
import { JOURNEY_COMPLETE_CONTENT_CLASS, ASSESSMENT_CONTENT_MAX_CLASS } from './mcq/mcqLayout'

function formatBookingDisplayId(employeeId: string): string {
  const normalized = employeeId.trim().toUpperCase()
  if (!normalized) return 'XYZ 123'
  if (normalized.startsWith('HRM') && normalized.length > 3) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3)}`
  }
  return normalized
}

/** Figma node 6120:15284 — final appointment journey complete (without coins) */
const APP_LOGIN_URL = 'https://app.supershyft.com/#login'

export function AppointmentJourneyCompleteStep({
  bookingId = 'XYZ 123',
  onDownloadApp,
}: {
  bookingId?: string
  onDownloadApp?: () => void
}) {
  const handleDownloadApp = () => {
    if (onDownloadApp) {
      onDownloadApp()
      return
    }
    window.location.assign(APP_LOGIN_URL)
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col pb-6 pt-[84px]">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className={`${JOURNEY_COMPLETE_CONTENT_CLASS} gap-6`}>
          <div className="flex w-full flex-col items-center gap-6">
            <div className="flex flex-col items-center py-2">
              <div className="flex size-24 items-center justify-center rounded-full bg-[#f973a9] shadow-[0_0_20px_rgba(249,115,169,0.4)]">
                <img src={bookingConfirmedCheck} alt="" className="size-10" aria-hidden />
              </div>
            </div>
            <h2 className="pb-3 text-center text-[18px] font-semibold tracking-[0.2px] text-white">
              Appointment Booking Confirmed!
            </h2>
          </div>

          <div className="flex w-full flex-col items-center gap-6 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-[13px] backdrop-blur-[12px]">
            <div className="flex w-full flex-col items-center gap-1.5 px-1.5 text-center">
              <p className="text-[11px] leading-[15px] text-[#9a9a9a]">Booking ID</p>
              <p className="text-[24px] font-extrabold leading-8 tracking-[4px] text-[#90df9e]">
                {formatBookingDisplayId(bookingId)}
              </p>
            </div>

            <div className="h-px w-[252px] bg-white/10" />

            <div className="flex w-full flex-col gap-1">
              <div className="flex w-full items-center justify-between whitespace-nowrap">
                <div className="flex flex-col items-start gap-1">
                  <p className="text-[16px] font-semibold leading-[22px] tracking-[-0.96px] text-white">
                    Step 1
                  </p>
                  <p className="text-[11px] leading-3 text-[#90df9e]">Completed</p>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <p className="text-[16px] font-semibold leading-[22px] tracking-[-0.96px] text-white">
                    Step 2
                  </p>
                  <p className="text-[11px] leading-3 text-[#90df9e]">Completed</p>
                </div>
              </div>
              <div className="relative mt-4 h-2 w-full rounded-full bg-white/10">
                <div className="absolute inset-0 rounded-full bg-[#dac15a]" />
                <div className="absolute right-0 top-1/2 size-4 -translate-y-1/2 translate-x-[15%] rounded-full border-[3px] border-[#dac15a] bg-white shadow-[0_0_15px_#dac15a]" />
              </div>
            </div>

            <p className="text-center text-[12px] font-light leading-normal text-white">
              Get the Supershyft app for complete details
            </p>
          </div>
        </div>
      </div>

      <div
        className={`mx-auto mt-6 flex w-full ${ASSESSMENT_CONTENT_MAX_CLASS} shrink-0 flex-col items-center gap-1.5 px-6`}
      >
        <ContinueButton
          variant="mobileBar"
          className="!h-[52px] w-full border border-[#969696] shadow-[0_12px_20px_rgba(255,255,255,0.15)]"
          showChevron={false}
          onClick={handleDownloadApp}
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
