export type McqInfoItem = {
  term: string
  description: string
}

export const GLOW_CLASS_BY_THEME = {
  family: 'bg-[rgba(124,58,237,0.25)]',
  lifestyle: 'bg-[rgba(233,136,40,0.25)]',
  nutrition: 'bg-[rgba(63,156,255,0.25)]',
} as const

export const TEXT_CLASS_BY_THEME = {
  family: 'text-[#ccc]',
  lifestyle: 'text-[#ccc]',
  nutrition: 'text-white',
} as const

export const SEPARATOR_BY_THEME = {
  family: ' : ',
  lifestyle: ' : ',
  nutrition: ': ',
} as const

export type McqInfoTheme = keyof typeof GLOW_CLASS_BY_THEME
