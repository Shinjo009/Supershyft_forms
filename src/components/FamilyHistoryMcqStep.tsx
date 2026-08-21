import { useEffect, useMemo, useState, type ReactNode } from 'react'
import coastalImg from '../assets/family-history/coastal.webp'
import inlandImg from '../assets/family-history/inland.webp'
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
import { OTHER_SPECIFY_MAX_LENGTH } from '../lib/apiOtherFollowUps'
import { FamilyHistoryInfoOverlay } from './family-history/FamilyHistoryInfoOverlay'
import { FamilyHistoryQuestionHeader } from './family-history/FamilyHistoryQuestionHeader'
import { MCQ_PILL_CHIP_CLASS, MCQ_QUESTION_HINT_CLASS } from './mcq/mcqLayout'
import { CHIP_SELECTED_GRADIENT, FamilyHistoryMcqShell } from './family-history/FamilyHistoryMcqShell'

type LocationOption = 'inland' | 'coastal'

const LOCATION_OPTIONS: {
  id: LocationOption
  label: string
  image: string
  imageTop: string
  description: string
}[] = [
  {
    id: 'inland',
    label: 'Inland',
    image: inlandImg,
    imageTop: '-61px',
    description: 'Away from the Coastline',
  },
  {
    id: 'coastal',
    label: 'Coastal',
    image: coastalImg,
    imageTop: '-65px',
    description: 'Along or near the Coast',
  },
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

function handleChipToggle(
  current: FamilyHistoryHealthCondition[],
  id: FamilyHistoryHealthCondition,
  clearOtherText: () => void,
): FamilyHistoryHealthCondition[] {
  const next = toggleChipSelection(current, id)
  if (id === 'other' && !next.includes('other')) clearOtherText()
  if (id === 'none' && next.includes('none')) clearOtherText()
  return next
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
  const [relativeOtherText, setRelativeOtherText] = useState('')
  const [personalOtherText, setPersonalOtherText] = useState('')
  const [medicationOtherText, setMedicationOtherText] = useState('')
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

  const isCurrentQuestionAnswered = useMemo(() => {
    switch (questionIndex) {
      case 0:
        return locationAnswer !== null
      case 1:
        return relativeHealthConditions.length > 0
      case 2:
        return personalDiagnoses.length > 0
      case 3:
        return medicationSelections.length > 0
      default:
        return false
    }
  }, [
    questionIndex,
    locationAnswer,
    relativeHealthConditions,
    personalDiagnoses,
    medicationSelections,
  ])

  return (
    <FamilyHistoryMcqShell
      onBack={handleBack}
      onNext={handleNext}
      progressPercent={familyHistoryProgressPercent(questionIndex, isCurrentQuestionAnswered)}
      isLastQuestion={questionIndex === FAMILY_HISTORY_TOTAL_QUESTIONS - 1}
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
          otherText={relativeOtherText}
          onOtherTextChange={setRelativeOtherText}
          onToggle={(id) =>
            setRelativeHealthConditions((current) =>
              handleChipToggle(current, id, () => setRelativeOtherText('')),
            )
          }
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : questionIndex === 2 ? (
        <MultiSelectChipQuestion
          questionNumber={3}
          title={<p>Are you diagnosed with the following diseases?</p>}
          selected={personalDiagnoses}
          otherText={personalOtherText}
          onOtherTextChange={setPersonalOtherText}
          onToggle={(id) =>
            setPersonalDiagnoses((current) =>
              handleChipToggle(current, id, () => setPersonalOtherText('')),
            )
          }
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : (
        <MultiSelectChipQuestion
          questionNumber={4}
          title={<p>Are you taking medications for the following diseases?</p>}
          options={FAMILY_HISTORY_MEDICATION_OPTIONS}
          selected={medicationSelections}
          otherText={medicationOtherText}
          onOtherTextChange={setMedicationOtherText}
          onToggle={(id) =>
            setMedicationSelections((current) =>
              handleChipToggle(current, id, () => setMedicationOtherText('')),
            )
          }
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
    <div className="mx-auto flex w-full flex-col items-center gap-[32px]">
      <FamilyHistoryQuestionHeader
        questionLabel={`Question 1 of ${FAMILY_HISTORY_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>Where have you lived most of your life?</p>
      </FamilyHistoryQuestionHeader>

      <div className="flex h-[280px] w-full max-w-[267px] flex-col gap-[16px] lg:max-w-[320px]">
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
                decoding="async"
                fetchPriority="high"
                loading="eager"
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
              <div className="relative flex max-w-[160px] flex-col items-end gap-1 text-right">
                <span
                  className={[
                    'whitespace-nowrap text-[14px] leading-[15px] text-white',
                    isSelected ? 'font-semibold' : 'font-normal',
                  ].join(' ')}
                >
                  {option.label}
                </span>
                <span className="text-[10px] font-normal leading-[13px] text-white/90">
                  {option.description}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Shared chip multi-select — Figma 5629:15433, 5657:51170, 5657:51263; Other expand 4775:40135 */
function MultiSelectChipQuestion({
  questionNumber,
  title,
  options = FAMILY_HISTORY_HEALTH_CONDITIONS,
  selected,
  otherText,
  onOtherTextChange,
  onToggle,
  onInfoClick,
}: {
  questionNumber: number
  title: ReactNode
  options?: { id: FamilyHistoryHealthCondition; label: string }[]
  selected: FamilyHistoryHealthCondition[]
  otherText: string
  onOtherTextChange: (value: string) => void
  onToggle: (id: FamilyHistoryHealthCondition) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-[32px]">
      <FamilyHistoryQuestionHeader
        questionLabel={`Question ${questionNumber} of ${FAMILY_HISTORY_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        {title}
        <p className={MCQ_QUESTION_HINT_CLASS}>(Select multiple or none that apply)</p>
      </FamilyHistoryQuestionHeader>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap content-center gap-4">
          {options.map((option) => {
            const isSelected = selected.includes(option.id)

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onToggle(option.id)}
                className={[
                  `flex ${MCQ_PILL_CHIP_CLASS} items-center justify-center gap-2.5 rounded-[24px] border border-solid px-2.5 py-1`,
                  isSelected ? 'border-[#d0d0d0] font-semibold' : 'border-[#969696] font-normal',
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
        {selected.includes('other') ? (
          <input
            type="text"
            value={otherText}
            maxLength={OTHER_SPECIFY_MAX_LENGTH}
            onChange={(event) => onOtherTextChange(event.target.value)}
            placeholder="Please specify (optional)"
            className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-[16px] font-light leading-6 text-white outline-none placeholder:text-[#9a9a9a]"
            aria-label="Please specify other condition"
          />
        ) : null}
      </div>
    </div>
  )
}
