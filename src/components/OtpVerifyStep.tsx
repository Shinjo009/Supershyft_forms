import { useEffect, useRef, useState } from 'react'
import { ContinueButton } from './ContinueButton'

export const OTP_LENGTH = 6
const RESEND_SECONDS = 30

function maskIndianMobile(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10)
  if (digits.length !== 10) return phone
  return `+91 ${digits.slice(0, 2)}****${digits.slice(6)}`
}

function digitsOnly(value: string, max = OTP_LENGTH): string {
  return value.replace(/\D/g, '').slice(0, max)
}

type Props = {
  phone: string
  isVerifying?: boolean
  isResending?: boolean
  onVerify: (otp: string) => void
  onResend: () => void
  onChangeNumber?: () => void
}

export function OtpVerifyStep({
  phone,
  isVerifying = false,
  isResending = false,
  onVerify,
  onResend,
  onChangeNumber,
}: Props) {
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: OTP_LENGTH }, () => ''))
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const [hasResent, setHasResent] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const otp = digits.join('')
  const canVerify = otp.length === OTP_LENGTH && !isVerifying
  const canResend = secondsLeft <= 0 && !isResending && !isVerifying
  const busy = isVerifying || isResending

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft])

  const applyDigits = (next: string[], focusIndex: number) => {
    setDigits(next)
    const bounded = Math.max(0, Math.min(OTP_LENGTH - 1, focusIndex))
    window.requestAnimationFrame(() => inputRefs.current[bounded]?.focus())
  }

  const handleChange = (index: number, raw: string) => {
    if (busy) return
    const incoming = digitsOnly(raw)
    if (!incoming) {
      const next = [...digits]
      next[index] = ''
      applyDigits(next, index)
      return
    }

    const next = [...digits]
    if (incoming.length > 1) {
      incoming.split('').forEach((digit, offset) => {
        if (index + offset < OTP_LENGTH) next[index + offset] = digit
      })
      applyDigits(next, Math.min(OTP_LENGTH - 1, index + incoming.length))
      return
    }

    next[index] = incoming
    applyDigits(next, incoming ? index + 1 : index)
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (busy) return
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      const next = [...digits]
      next[index - 1] = ''
      applyDigits(next, index - 1)
      return
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      inputRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    if (busy) return
    const pasted = digitsOnly(event.clipboardData.getData('text'))
    if (!pasted) return
    const next = [...digits]
    pasted.split('').forEach((digit, offset) => {
      if (index + offset < OTP_LENGTH) next[index + offset] = digit
    })
    applyDigits(next, Math.min(OTP_LENGTH - 1, index + pasted.length))
  }

  const handleResend = () => {
    if (!canResend) return
    setDigits(Array.from({ length: OTP_LENGTH }, () => ''))
    setSecondsLeft(RESEND_SECONDS)
    setHasResent(true)
    onResend()
    window.requestAnimationFrame(() => inputRefs.current[0]?.focus())
  }

  const handleVerify = () => {
    if (!canVerify) return
    onVerify(otp)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-[18px] font-semibold text-white">Verify OTP</h2>
        <p className="text-[12px] leading-4 text-[#9a9a9a]">
          Enter the 6-digit code sent to your WhatsApp at{' '}
          <span className="font-medium text-[#ccc]">{maskIndianMobile(phone)}</span>
          {hasResent ? ' and email' : ''}
        </p>
        {onChangeNumber ? (
          <button
            type="button"
            onClick={onChangeNumber}
            className="self-start text-[13px] font-medium text-[#4b8d83]"
          >
            Change number
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputRefs.current[index] = node
              }}
              className="booking-field-input h-12 w-full min-w-0 rounded-[8px] border border-transparent bg-white/5 text-center text-[18px] font-semibold tracking-[2px] text-[#ccc] outline-none focus:border-[#4b8d83] disabled:opacity-60"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              pattern="[0-9]*"
              maxLength={index === 0 ? OTP_LENGTH : 1}
              aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
              value={digit}
              disabled={busy}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={(event) => handlePaste(index, event)}
              onFocus={(event) => event.currentTarget.select()}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[#9a9a9a]">Didn’t receive the code?</p>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-[13px] font-medium text-[#4b8d83]"
            >
              {isResending ? 'Sending...' : 'Resend OTP'}
            </button>
          ) : (
            <p className="text-[12px] font-medium text-[#ccc]">
              Resend in 0:{String(secondsLeft).padStart(2, '0')}
            </p>
          )}
        </div>
      </div>

      <ContinueButton
        className="w-full max-w-none"
        showChevron={false}
        variant="mobileBarCompact"
        disabled={!canVerify}
        onClick={handleVerify}
      >
        {isVerifying ? 'Verifying...' : 'Verify OTP'}
      </ContinueButton>
    </div>
  )
}
