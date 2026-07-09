import { useEffect, useState, type ReactNode } from 'react'
import coastalImg from '../assets/family-history/coastal.jpg'
import inlandImg from '../assets/family-history/inland.jpg'
import tickCircleIcon from '../assets/family-history/tick-circle-outline.svg'
import {
  FAMILY_HISTORY_HEALTH_CONDITIONS,
  FAMILY_HISTORY_INFO_BY_QUESTION,
  FAMILY_HISTORY_MEDICATION_OPTIONS,
  FAMILY_HISTORY_NEXT_PREVIEWS,
  FAMILY_HISTORY_TOTAL_QUESTIONS,
  familyHistoryProgressPercent,
  type FamilyHistoryHealthCondition,
} from '../data/familyHistoryQuestions'
import { FamilyHistoryInfoOverlay } from './family-history/FamilyHistoryInfoOverlay'
import { FamilyHistoryQuestionHeader } from './family-history/FamilyHistoryQuestionHeader'
import { CHIP_SELECTED_GRADIENT, FamilyHistoryMcqShell } from './family-history/FamilyHistoryMcqShell'

type LocationOption = 'inland' | 'coastal'

const LOCATION_OPTIONS: { id: LocationOption; label: string; image: string; imageTop: string }[] = [
  { id: 'inland', label: 'Inland', image: inlandImg, imageTop: '-61px' },
  { id: 'coastal', label: 'Coastal', image: coastalImg, imageTop: '-65px' },
]

function toggleChipSelection(
  current: FamilyHistoryHealthCondition[],
  id: FamilyHistoryHealthCondition,
): FamilyHistoryHealthCondition[] {
  if (id === 'none') {
    return current.includes('none') ? [] : ['none']
  }

  const withoutNone = current.filter((item) => item !== 'none')
  if (withoutNone.includes(id)) {
    return withoutNone.filter((item) => item !== id)
  }
  return [...withoutNone, id]
}

/** Family History MCQ flow — shared layout, per-question content */
export function FamilyHistoryMcqStep({
  onBack,
  onComplete,
}: {
  onBack?: () => void
  onComplete?: () => void
}) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [locationAnswer, setLocationAnswer] = useState<LocationOption | null>(null)
  const [relativeHealthConditions, setRelativeHealthConditions] = useState<
    FamilyHistoryHealthCondition[]
  >([])
  const [personalDiagnoses, setPersonalDiagnoses] = useState<FamilyHistoryHealthCondition[]>([])
  const [medicationSelections, setMedicationSelections] = useState<FamilyHistoryHealthCondition[]>(
    [],
  )
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    setInfoOpen(false)
  }, [questionIndex])

  const handleBack = () => {
    if (infoOpen) {
      setInfoOpen(false)
      return
    }
    if (questionIndex > 0) {
      setQuestionIndex((index) => index - 1)
      return
    }
    onBack?.()
  }

  const handleNext = () => {
    if (questionIndex < FAMILY_HISTORY_TOTAL_QUESTIONS - 1) {
      setQuestionIndex((index) => index + 1)
      return
    }
    onComplete?.()
  }

  return (
    <FamilyHistoryMcqShell
      onBack={handleBack}
      onNext={handleNext}
      progressPercent={familyHistoryProgressPercent(questionIndex)}
      nextQuestionPreview={
        FAMILY_HISTORY_NEXT_PREVIEWS[questionIndex] ?? { line1: '', line2: '' }
      }
    >
      {questionIndex === 0 ? (
        <Question1Location
          selected={locationAnswer}
          onSelect={setLocationAnswer}
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : questionIndex === 1 ? (
        <MultiSelectChipQuestion
          questionNumber={2}
          title={
            <>
              <p>Do any of your close blood relatives </p>
              <p>(i.e., parents or siblings) have the following health conditions?</p>
            </>
          }
          selected={relativeHealthConditions}
          onToggle={(id) => setRelativeHealthConditions((current) => toggleChipSelection(current, id))}
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : questionIndex === 2 ? (
        <MultiSelectChipQuestion
          questionNumber={3}
          title={<p>Are you diagnosed with the following diseases?</p>}
          selected={personalDiagnoses}
          onToggle={(id) => setPersonalDiagnoses((current) => toggleChipSelection(current, id))}
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : (
        <MultiSelectChipQuestion
          questionNumber={4}
          title={<p>Are you taking medications for the following diseases?</p>}
          options={FAMILY_HISTORY_MEDICATION_OPTIONS}
          selected={medicationSelections}
          onToggle={(id) => setMedicationSelections((current) => toggleChipSelection(current, id))}
          onInfoClick={() => setInfoOpen(true)}
        />
      )}

      <FamilyHistoryInfoOverlay
        open={infoOpen}
        items={FAMILY_HISTORY_INFO_BY_QUESTION[questionIndex] ?? []}
        onClose={() => setInfoOpen(false)}
      />
    </FamilyHistoryMcqShell>
  )
}

/** Figma 5706:16633 */
function Question1Location({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: LocationOption | null
  onSelect: (value: LocationOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="mx-auto flex w-[326px] flex-col items-center gap-[32px]">
      <FamilyHistoryQuestionHeader
        questionLabel={`Question 1 of ${FAMILY_HISTORY_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>Where have you lived most of your life?</p>
      </FamilyHistoryQuestionHeader>

      <div className="flex h-[254px] w-[267px] flex-col gap-[16px]">
        {LOCATION_OPTIONS.map((option) => {
          const isSelected = selected === option.id
          const isInland = option.id === 'inland'

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={[
                'relative flex min-h-0 flex-1 flex-col items-end justify-center overflow-hidden rounded-xl px-6 py-3',
                isInland
                  ? 'bg-gradient-to-b from-black to-transparent'
                  : 'bg-gradient-to-l from-black to-transparent',
                isSelected
                  ? 'border-[0.5px] border-solid border-[#9d50bb] shadow-[0_0_20px_0_rgba(157,80,187,0.4)]'
                  : 'border-[0.5px] border-solid border-[rgba(255,255,255,0.5)]',
              ].join(' ')}
            >
              <img
                src={option.image}
                alt=""
                className="pointer-events-none absolute -left-4 h-[189px] w-[283px] object-cover"
                style={{ top: option.imageTop }}
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
              <span
                className={[
                  'relative whitespace-nowrap text-[14px] leading-[15px] text-white',
                  isSelected ? 'font-semibold' : 'font-normal',
                ].join(' ')}
              >
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Shared chip multi-select — Figma 5629:15433, 5657:51170, 5657:51263 */
function MultiSelectChipQuestion({
  questionNumber,
  title,
  options = FAMILY_HISTORY_HEALTH_CONDITIONS,
  selected,
  onToggle,
  onInfoClick,
}: {
  questionNumber: number
  title: ReactNode
  options?: { id: FamilyHistoryHealthCondition; label: string }[]
  selected: FamilyHistoryHealthCondition[]
  onToggle: (id: FamilyHistoryHealthCondition) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-[32px]">
      <FamilyHistoryQuestionHeader
        questionLabel={`Question ${questionNumber} of ${FAMILY_HISTORY_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        {title}
        <p className="mt-0 text-[12px] text-[#bbb]">(Select multiple or None that apply)</p>
      </FamilyHistoryQuestionHeader>

      <div className="flex flex-wrap content-center gap-4">
        {options.map((option) => {
          const isSelected = selected.includes(option.id)

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggle(option.id)}
              className={[
                'flex w-[155px] items-center justify-center gap-2.5 rounded-[24px] border-[0.5px] border-solid px-2.5 py-1',
                isSelected
                  ? 'border-[#d0d0d0] font-semibold'
                  : 'border-[rgba(255,255,255,0.3)] font-normal',
              ].join(' ')}
              style={isSelected ? { backgroundImage: CHIP_SELECTED_GRADIENT } : undefined}
            >
              {isSelected ? (
                <img src={tickCircleIcon} alt="" className="size-3 shrink-0" aria-hidden />
              ) : null}
              <span className="whitespace-nowrap text-[12px] leading-6 text-white">{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
