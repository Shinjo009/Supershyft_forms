import journeySuccessGif from '../assets/animation-gif.gif'
import { ContinueButton } from './ContinueButton'
import { JOURNEY_COMPLETE_CONTENT_CLASS, ASSESSMENT_CONTENT_MAX_CLASS } from './mcq/mcqLayout'

/** Figma node 6120:15284 — final appointment journey complete (without coins) */
const APP_LOGIN_URL = 'https://app.supershyft.com/#login'

export function AppointmentJourneyCompleteStep({
  onDownloadApp,
}: {
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
    <div className="flex min-h-0 w-full flex-1 flex-col pb-6 pt-6">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className={`${JOURNEY_COMPLETE_CONTENT_CLASS} gap-6`}>
          <div className="flex w-full flex-col items-center gap-3">
            <img
              src={journeySuccessGif}
              alt=""
              draggable={false}
              className="mx-auto h-[148px] w-[148px] object-contain"
            />
            <div className="flex w-full flex-col items-center gap-1">
              <h2 className="text-center text-[18px] font-semibold tracking-[0.2px] text-white">
                Appointment Booking Confirmed!
              </h2>
              <p className="text-center text-xs font-normal leading-5 text-neutral-400 font-['Lato']">
                Congratulations! Your Bio-AI Test is booked successfully.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-6 rounded-xl border border-white/10 bg-white/5 p-[13px] backdrop-blur-[12px]">
            <div className="flex w-full flex-col gap-1">
              <div className="flex w-full items-start justify-between">
                <div className="flex flex-col items-start gap-1">
                  <p className="text-[16px] font-semibold leading-5 tracking-[-0.96px] text-white">
                    Step 1
                  </p>
                  <p className="text-[11px] leading-[14px] text-[#90df9e]">Completed</p>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <p className="text-[16px] font-semibold leading-5 tracking-[-0.96px] text-white">
                    Step 2
                  </p>
                  <p className="text-[11px] leading-[14px] text-[#90df9e]">Completed</p>
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
          Install Supershyft
        </ContinueButton>
        <p className="text-center text-[14px] font-medium leading-[22.5px] text-[#999]">OR</p>
        <p className="text-center text-[11px] font-medium leading-[22.5px] text-[#999]">
          We will get in touch with you on WhatsApp/email
        </p>
      </div>
    </div>
  )
}
