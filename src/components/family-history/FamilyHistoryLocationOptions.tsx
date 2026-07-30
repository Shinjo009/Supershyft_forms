import coastalImg from '../../assets/family-history/coastal.webp'
import inlandImg from '../../assets/family-history/inland.webp'
import {
  getOptionLabel,
  getOptionValue,
  type QuestionnaireOption,
} from '../../api/questionnaire'
import { resolveLocationCardKind } from '../../lib/apiQuestionLayouts'
import { FamilyHistoryQuestionHeader } from './FamilyHistoryQuestionHeader'

const CARD_META: Record<
  'inland' | 'coastal',
  { image: string; imageTop: string; isInland: boolean }
> = {
  inland: { image: inlandImg, imageTop: '-61px', isInland: true },
  coastal: { image: coastalImg, imageTop: '-65px', isInland: false },
}

/** Warm the location card images into browser cache as soon as this module loads. */
if (typeof document !== 'undefined') {
  for (const src of [inlandImg, coastalImg]) {
    const img = new Image()
    img.src = src
  }
}

/** Designed Inland / Coastal cards — driven by API option labels/values. */
export function FamilyHistoryLocationOptions({
  questionLabel,
  questionText,
  options,
  selectedValue,
  onSelect,
  onInfoClick,
  disabled = false,
}: {
  questionLabel: string
  questionText: string
  options: QuestionnaireOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  onInfoClick?: () => void
  disabled?: boolean
}) {
  return (
    <div className="mx-auto flex w-full flex-col items-center gap-[32px]">
      <FamilyHistoryQuestionHeader questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <p>{questionText}</p>
      </FamilyHistoryQuestionHeader>

      <div className="flex h-[254px] w-full max-w-[267px] flex-col gap-[16px] lg:max-w-[320px]">
        {options.map((option) => {
          const value = getOptionValue(option)
          const label = getOptionLabel(option) || value
          if (!value && !label) return null

          const kind = resolveLocationCardKind(option)
          const meta = kind ? CARD_META[kind] : null
          const isSelected = selectedValue === value
          const isInland = meta?.isInland ?? false

          return (
            <button
              key={value || label}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(value)}
              className={[
                'relative flex min-h-0 flex-1 flex-col items-end justify-center overflow-hidden rounded-xl px-6 py-3 disabled:opacity-60',
                isInland
                  ? 'bg-gradient-to-b from-black to-transparent'
                  : 'bg-gradient-to-l from-black to-transparent',
                isSelected
                  ? 'border-[0.5px] border-solid border-[#9d50bb] shadow-[0_0_20px_0_rgba(157,80,187,0.4)]'
                  : 'border-[0.5px] border-solid border-[rgba(255,255,255,0.5)]',
              ].join(' ')}
            >
              {meta ? (
                <>
                  <img
                    src={meta.image}
                    alt=""
                    decoding="async"
                    fetchPriority="high"
                    loading="eager"
                    className="pointer-events-none absolute -left-4 h-[189px] w-[283px] object-cover"
                    style={{ top: meta.imageTop }}
                    aria-hidden
                  />
                  <div
                    className={[
                      'pointer-events-none absolute bg-gradient-to-l from-black to-transparent',
                      isInland
                        ? 'left-[-3px] top-[-7px] h-[126px] w-[270px]'
                        : 'left-[-2px] top-[-17px] h-[136px] w-[269px]',
                    ].join(' ')}
                  />
                </>
              ) : null}
              <span
                className={[
                  'relative whitespace-nowrap text-[14px] leading-[15px] text-white',
                  isSelected ? 'font-semibold' : 'font-normal',
                ].join(' ')}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
