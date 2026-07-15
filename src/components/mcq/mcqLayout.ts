/** Responsive layout tokens — mobile Figma (360px), centered and scaled on desktop */

export const APP_COLUMN_CLASS =
  'mx-auto h-full w-full max-w-[360px] lg:max-w-[480px] xl:max-w-[520px]'

export const MCQ_SHELL_CLASS =
  'relative mx-auto flex h-full min-h-0 w-full max-w-[360px] lg:max-w-[480px] xl:max-w-[520px] flex-col pb-[72px]'

export const MCQ_SHELL_SCROLL_CLASS =
  'mt-2 min-h-0 flex-1 overflow-y-auto px-[17px] lg:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

export const MCQ_SHELL_FOOTER_INNER_CLASS =
  'mx-auto flex w-full max-w-[360px] lg:max-w-[480px] xl:max-w-[520px] items-center justify-between gap-3 px-6 py-2 lg:px-8'

/** One-line next-question preview; truncates with ".." when too long. */
export function formatNextQuestionPreview(line1: string, line2: string, maxChars = 28): string {
  const text = [line1, line2].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars).trimEnd()}..`
}

export const MCQ_INFO_CARD_CLASS =
  'relative w-full max-w-[335px] overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.5)] bg-[rgba(0,0,0,0.5)] px-[21px] py-[31px] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-[5px] lg:max-w-[420px] lg:px-7 lg:py-9'

export const ASSESSMENT_CARD_STACK_CLASS =
  'mx-auto flex w-full max-w-[294px] lg:max-w-[400px] flex-col gap-[18px]'

export const ASSESSMENT_CONTENT_MAX_CLASS = 'max-w-[294px] lg:max-w-[400px]'

export const ASSESSMENT_SUBTITLE_CLASS =
  'mt-1.5 max-w-[312px] lg:max-w-[440px] text-center text-[12px] leading-4 text-[#9a9a9a] lg:text-[13px]'

export const JOURNEY_COMPLETE_CONTENT_CLASS =
  'flex w-full max-w-[312px] lg:max-w-[400px] flex-col items-center gap-6'

export const MCQ_PILL_CHIP_CLASS = 'w-[155px] lg:w-[calc(50%-8px)]'

/** Helper / example line under a question title (! overrides parent text-white) */
export const MCQ_QUESTION_HINT_CLASS = 'mt-0 text-[12px] !text-[#9a9a9a]'

/** Solid borders — avoids 0.25/0.5px anti-alias fade by position on dark gradients */
export const MCQ_PILL_BORDER_IDLE = '#969696'
export const MCQ_PILL_BORDER_SELECTED = '#d0d0d0'

export const MCQ_DIAL_DESKTOP_CLASS = 'lg:scale-110 lg:origin-center'
