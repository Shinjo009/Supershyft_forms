import BookAppointment from './BookAppointment'
import { PageBackdrop } from './components/PageBackdrop'
import { resolveCampCode } from './lib/campCode'
import superShyftLogo from './assets/SuperShyft - Logo [Final]-03 7 (1).svg'

function MissingCampLink() {
  return (
    <PageBackdrop wide>
      <div className="flex h-full min-w-0 flex-col">
        <header className="grid shrink-0 grid-cols-[32px_1fr_32px] items-center p-5">
          <span className="size-8" aria-hidden />
          <h1 className="flex min-w-0 items-center justify-center gap-2 overflow-visible text-center text-[15px] font-semibold leading-5 text-white lg:gap-4 lg:text-[20px] lg:leading-6">
            <img
              src={superShyftLogo}
              alt=""
              className="h-10 w-10 shrink-0 object-contain"
              aria-hidden
            />
            <span className="min-w-0">Book Appointment for Bio-AI health camp.</span>
          </h1>
          <span className="size-8" aria-hidden />
        </header>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-[18px] font-semibold text-white">Use the link you were sent.</p>
          <p className="mt-2 max-w-[280px] text-[13px] leading-5 text-[#9a9a9a]">
            This form only opens from a booking link that includes your camp code.
          </p>
        </div>
      </div>
    </PageBackdrop>
  )
}

function App() {
  const campCode = resolveCampCode()
  if (!campCode) return <MissingCampLink />
  return <BookAppointment campCode={campCode} />
}

export default App
