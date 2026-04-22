import { Users, X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  onYes: () => void
  onNo: () => void
  displayName?: string
}

export function AddMemberModal({ open, onClose, onYes, onNo, displayName = 'John Doe' }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-[440px] rounded-3xl border border-white/10 bg-black/40 p-10 shadow-xl backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-member-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="flex flex-col items-center gap-10">
          <div className="flex size-20 items-center justify-center rounded-full border-2 border-[#4b8d83] bg-[#2d8a7e]/10">
            <Users className="size-8 text-[#90df9e]" />
          </div>

          <div className="flex w-full max-w-[400px] items-center justify-between rounded-md border border-[#90df9e]/20 bg-[#4b8d83]/10 px-3 py-3">
            <span className="text-base font-semibold text-white">{displayName}</span>
            <span className="text-[#90df9e]" aria-hidden>
              ✓
            </span>
          </div>

          <div className="text-center">
            <h2 id="add-member-title" className="text-[28px] font-bold text-white">
              Add Another Member?
            </h2>
            <p className="mt-2 text-base leading-snug text-[#9a9a9a]">
              You can book this health assessment for your family in a single appointment.
            </p>
          </div>

          <div className="flex w-full max-w-[400px] flex-col gap-4">
            <button
              type="button"
              onClick={onYes}
              className="h-[49px] w-full rounded-[36px] border border-[#969696] bg-gradient-to-r from-[#296359] to-[#41ab99] text-[15px] text-white shadow-[0_12px_20px_0_rgba(255,255,255,0.15)] transition hover:brightness-110"
            >
              Yes, add another member
            </button>
            <button
              type="button"
              onClick={onNo}
              className="w-full rounded-full border border-white/20 px-8 py-4 text-[15px] text-white transition hover:bg-white/5"
            >
              No, continue with 1 person
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
