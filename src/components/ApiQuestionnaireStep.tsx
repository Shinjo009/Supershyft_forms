import { useEffect, useMemo, useRef, useState } from 'react'
import backIcon from '../assets/family-history/back-icon.svg'
import nextChevronIcon from '../assets/family-history/next-chevron.svg'
import tickCircleIcon from '../assets/family-history/tick-circle-outline.svg'
import {
  buildQuestionnaireResponses,
  getOptionLabel,
  getOptionValue,
  isMultiChoiceType,
  isSingleChoiceType,
  isTextType,
  resolveAnswerTokenToOptionValue,
  submitQuestionnaireResponses,
  type QuestionnaireQuestion,
} from '../api/questionnaire'
import { getAccessToken } from '../lib/authStorage'
import {
  buildNavigableQuestionnaireQuestions,
  findOtherFollowUpForParent,
  findParentForOtherFollowUp,
  isInlinedOtherTextQuestion,
  OTHER_SPECIFY_MAX_LENGTH,
  selectedIncludesOther,
} from '../lib/apiOtherFollowUps'
import {
  isFamilyHistoryLocationQuestion,
  isLifestyleActivityIntensityQuestion,
  isLifestyleAlcoholConsumptionQuestion,
  isLifestyleCommitmentQuestion,
  isLifestyleDailyWalkingQuestion,
  isLifestylePhysicalActivityQuestion,
  isLifestyleSitDurationQuestion,
  isLifestyleSleepDurationQuestion,
  isLifestyleSmokingFrequencyQuestion,
  isLifestyleWeeklyLeisureQuestion,
  isLifestyleWellnessPrioritiesQuestion,
  isNutritionBreakfastFrequencyQuestion,
  isNutritionCoffeeTeaIntakeQuestion,
  isNutritionCoffeeTeaTypeQuestion,
  isNutritionConsumptionFrequencyQuestion,
  isNutritionDailyFoodGroupsQuestion,
  isNutritionDietTypeQuestion,
  isNutritionExtraSaltQuestion,
  isNutritionIllnessFrequencyQuestion,
  isNutritionIodizedSaltQuestion,
  isNutritionWaterIntakeQuestion,
  nutritionMeterIdForQuestion,
} from '../lib/apiQuestionLayouts'
import { parseHelpTextToInfoItems } from '../lib/parseHelpTextToInfoItems'
import { filterFoodGroupOptionsByDiet } from '../lib/filterFoodGroupsByDiet'
import {
  mergeDraftAnswers,
  seedAnswersFromQuestions,
  type AnswerValue,
} from '../lib/questionnaireVisibility'
import { FamilyHistoryLocationOptions } from './family-history/FamilyHistoryLocationOptions'
import { LifestyleActivityIntensityQuestion } from './lifestyle-habits/LifestyleActivityIntensityQuestion'
import { LifestyleAlcoholConsumptionQuestion } from './lifestyle-habits/LifestyleAlcoholConsumptionQuestion'
import { LifestyleCommitmentQuestion } from './lifestyle-habits/LifestyleCommitmentQuestion'
import { LifestyleDailyWalkingQuestion } from './lifestyle-habits/LifestyleDailyWalkingQuestion'
import { LifestylePhysicalActivityQuestion } from './lifestyle-habits/LifestylePhysicalActivityQuestion'
import { LifestyleSitDurationQuestion } from './lifestyle-habits/LifestyleSitDurationQuestion'
import { LifestyleSleepDurationQuestion } from './lifestyle-habits/LifestyleSleepDurationQuestion'
import { LifestyleSmokingFrequencyQuestion } from './lifestyle-habits/LifestyleSmokingFrequencyQuestion'
import { LifestyleWeeklyLeisureQuestion } from './lifestyle-habits/LifestyleWeeklyLeisureQuestion'
import { LifestyleWellnessPrioritiesQuestion } from './lifestyle-habits/LifestyleWellnessPrioritiesQuestion'
import {
  NutritionApiCircularMeterQuestion,
  NutritionApiConsumptionFrequencyQuestion,
} from './nutrition-log/NutritionApiCircularMeterQuestion'
import { NutritionApiMultiSelectQuestion } from './nutrition-log/NutritionApiMultiSelectQuestion'
import { NutritionApiPillRowQuestion } from './nutrition-log/NutritionApiPillRowQuestion'
import { NutritionApiWaterIntakeQuestion } from './nutrition-log/NutritionApiWaterIntakeQuestion'
import { NutritionDietTypeQuestion } from './nutrition-log/NutritionDietTypeQuestion'
import { NUTRITION_NEXT_BUTTON_GRADIENT, NUTRITION_PILL_GRADIENT } from './nutrition-log/nutritionLogConfig'
import {
  formatNextQuestionPreview,
  MCQ_PILL_BORDER_IDLE,
  MCQ_PILL_BORDER_SELECTED,
  MCQ_PILL_CHIP_CLASS,
  MCQ_SHELL_CLASS,
  MCQ_SHELL_FOOTER_CLASS,
  MCQ_SHELL_FOOTER_INNER_CLASS,
  MCQ_SHELL_SCROLL_CLASS,
} from './mcq/mcqLayout'
import { McqInfoOverlay } from './mcq/McqInfoOverlay'
import { McqProgressBar } from './mcq/McqProgressBar'
import { McqQuestionCopy } from './mcq/McqQuestionCopy'
import { McqQuestionHeader } from './mcq/McqQuestionHeader'

const FAMILY_NEXT_BUTTON_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.3'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(2.5 0 0 2.5 25 25)'><stop stop-color='rgba(164,86,234,1)' offset='0'/><stop stop-color='rgba(134,69,194,1)' offset='0.25'/><stop stop-color='rgba(103,52,153,1)' offset='0.5'/><stop stop-color='rgba(73,35,113,1)' offset='0.75'/><stop stop-color='rgba(42,18,72,1)' offset='1'/></radialGradient></defs></svg>\")"

const LIFESTYLE_NEXT_BUTTON_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.3'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(2.5 0 0 2.5 25 25)'><stop stop-color='rgba(255,136,0,1)' offset='0'/><stop stop-color='rgba(233,93,92,1)' offset='1'/></radialGradient></defs></svg>\")"

const FAMILY_CHIP_SELECTED_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 155 36' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.35'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(7.75 0 0 1.8 77.5 18)'><stop stop-color='rgba(164,86,234,1)' offset='0'/><stop stop-color='rgba(134,69,194,1)' offset='0.25'/><stop stop-color='rgba(103,52,153,1)' offset='0.5'/><stop stop-color='rgba(73,35,113,1)' offset='0.75'/><stop stop-color='rgba(42,18,72,1)' offset='1'/></radialGradient></defs></svg>\")"

const LIFESTYLE_CHIP_SELECTED_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 155 36' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.35'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(7.75 0 0 1.8 77.5 18)'><stop stop-color='rgba(255,136,0,1)' offset='0.46635'/><stop stop-color='rgba(233,93,92,0.5)' offset='1'/></radialGradient></defs></svg>\")"

type QuestionnaireTheme = 'family' | 'lifestyle' | 'nutrition'

const THEME_PROGRESS_COLOR: Record<QuestionnaireTheme, string> = {
  family: '#9D50BB',
  lifestyle: '#FF8800',
  nutrition: '#3F9CFF',
}

const THEME_NEXT_GRADIENT: Record<QuestionnaireTheme, string> = {
  family: FAMILY_NEXT_BUTTON_GRADIENT,
  lifestyle: LIFESTYLE_NEXT_BUTTON_GRADIENT,
  nutrition: NUTRITION_NEXT_BUTTON_GRADIENT,
}

const THEME_CHIP_GRADIENT: Record<QuestionnaireTheme, string> = {
  family: FAMILY_CHIP_SELECTED_GRADIENT,
  lifestyle: LIFESTYLE_CHIP_SELECTED_GRADIENT,
  nutrition: NUTRITION_PILL_GRADIENT,
}

const THEME_NEXT_SHADOW: Record<QuestionnaireTheme, string> = {
  family: 'shadow-[0_8px_32px_0_rgba(164,86,234,0.25)]',
  lifestyle: 'shadow-[0_8px_32px_0_rgba(255,136,0,0.25)]',
  nutrition: 'shadow-[0_8px_32px_0_rgba(79,172,254,0.2)]',
}

function progressPercent(index: number, total: number, answered: boolean): number {
  if (total <= 0) return 0
  const completed = index + (answered ? 1 : 0)
  return Math.round((completed / total) * 100)
}

function splitPreview(text: string): { line1: string; line2: string } {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= 4) return { line1: text.trim(), line2: '' }
  const mid = Math.ceil(words.length / 2)
  return { line1: words.slice(0, mid).join(' '), line2: words.slice(mid).join(' ') }
}

function isOptionSelected(option: { value: string; label: string }, selectedValues: string[]): boolean {
  return selectedValues.some((selected) => selected === option.value || selected === option.label)
}

function adjacentNonInlinedIndex(
  items: QuestionnaireQuestion[],
  allQuestions: QuestionnaireQuestion[],
  from: number,
  direction: 1 | -1,
): number {
  let next = from + direction
  while (
    next >= 0 &&
    next < items.length &&
    isInlinedOtherTextQuestion(items[next], allQuestions)
  ) {
    next += direction
  }
  return next
}

function toggleMulti(current: string[], value: string, maxSelections?: number): string[] {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'none') {
    return current.includes(value) ? [] : [value]
  }
  const withoutNone = current.filter((item) => item.trim().toLowerCase() !== 'none')
  if (withoutNone.includes(value)) {
    return withoutNone.filter((item) => item !== value)
  }
  if (typeof maxSelections === 'number' && maxSelections > 0 && withoutNone.length >= maxSelections) {
    return withoutNone
  }
  return [...withoutNone, value]
}

/** Ensure multi-choice / wellness answers are always arrays before POST.
 *  Also map labels / option ids to canonical option_value. */
function coerceAnswersForSubmit(
  answersById: Record<number, AnswerValue>,
  allQuestions: QuestionnaireQuestion[],
): Record<number, AnswerValue> {
  const next: Record<number, AnswerValue> = { ...answersById }
  for (const item of allQuestions) {
    const mustBeList =
      isMultiChoiceType(item.question_type) || isLifestyleWellnessPrioritiesQuestion(item)
    const isChoice =
      mustBeList || isSingleChoiceType(item.question_type)
    const value = next[item.question_id]
    if (value == null) continue

    if (mustBeList && !Array.isArray(value)) {
      if (typeof value === 'string' || typeof value === 'number') {
        const text = String(value).trim()
        next[item.question_id] = text ? [text] : []
      }
    }

    if (!isChoice) continue
    const current = next[item.question_id]
    if (Array.isArray(current)) {
      next[item.question_id] = current
        .map((itemValue) =>
          resolveAnswerTokenToOptionValue(String(itemValue ?? '').trim(), item.options),
        )
        .filter(Boolean)
      continue
    }
    if (typeof current === 'string' || typeof current === 'number') {
      next[item.question_id] = resolveAnswerTokenToOptionValue(String(current).trim(), item.options)
    }
  }
  return next
}

function hasAnswerValue(answer: AnswerValue | undefined): boolean {
  if (answer == null) return false
  if (Array.isArray(answer)) return answer.length > 0
  if (typeof answer === 'object') return Object.keys(answer).length > 0
  return String(answer).trim().length > 0
}

/** Every visible question is required. Selecting Other is enough; the specify-other text is optional. */
function isAnswered(question: QuestionnaireQuestion, answer: AnswerValue | undefined): boolean {
  if (question.is_read_only) return true
  return hasAnswerValue(answer)
}

export function ApiQuestionnaireStep({
  title,
  questions,
  assessmentInstanceId,
  categoryId,
  theme = 'family',
  initialAnswers,
  initialIndex = 0,
  onBack,
  onComplete,
  onDraftChange,
}: {
  title: string
  questions: QuestionnaireQuestion[]
  assessmentInstanceId: number
  categoryId: number
  theme?: QuestionnaireTheme
  initialAnswers?: Record<number, AnswerValue>
  initialIndex?: number
  onBack?: () => void
  onComplete?: (answers: Record<number, AnswerValue>) => void
  onDraftChange?: (answers: Record<number, AnswerValue>, index: number) => void
}) {
  const [visibleIndex, setVisibleIndex] = useState(() => Math.max(0, initialIndex))
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>(() =>
    mergeDraftAnswers(seedAnswersFromQuestions(questions), initialAnswers),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    setAnswers((prev) => mergeDraftAnswers(seedAnswersFromQuestions(questions), prev))
  }, [questions])

  useEffect(() => {
    setSaveError('')
    setInfoOpen(false)
  }, [categoryId])

  const onDraftChangeRef = useRef(onDraftChange)
  onDraftChangeRef.current = onDraftChange

  useEffect(() => {
    onDraftChangeRef.current?.(answers, visibleIndex)
  }, [answers, visibleIndex])

  const visibleQuestions = useMemo(
    () => buildNavigableQuestionnaireQuestions(questions, answers),
    [questions, answers],
  )

  useEffect(() => {
    if (visibleQuestions.length === 0) {
      setVisibleIndex(0)
      return
    }
    setVisibleIndex((current) => Math.min(current, visibleQuestions.length - 1))
  }, [visibleQuestions])

  useEffect(() => {
    setInfoOpen(false)
  }, [visibleIndex])

  const total = visibleQuestions.length
  const questionAtIndex = visibleQuestions[visibleIndex]
  const parentQuestion = questionAtIndex
    ? findParentForOtherFollowUp(questionAtIndex, questions)
    : null
  const parentVisibleIndex = parentQuestion
    ? visibleQuestions.findIndex((item) => item.question_id === parentQuestion.question_id)
    : -1
  const displayIndex = parentVisibleIndex >= 0 ? parentVisibleIndex : visibleIndex
  const question = visibleQuestions[displayIndex] ?? questionAtIndex
  const nextNavIndex = adjacentNonInlinedIndex(visibleQuestions, questions, displayIndex, 1)
  const nextQuestion =
    nextNavIndex >= 0 && nextNavIndex < visibleQuestions.length
      ? visibleQuestions[nextNavIndex]
      : undefined
  const answer = question ? answers[question.question_id] : undefined
  const answered = question ? isAnswered(question, answer) : false
  const percent = progressPercent(displayIndex, total, answered)
  const isLast = nextNavIndex < 0 || nextNavIndex >= total
  const nextPreview = useMemo(
    () => splitPreview(nextQuestion?.question_text || ''),
    [nextQuestion?.question_text],
  )
  const infoItems = useMemo(
    () => parseHelpTextToInfoItems(question?.help_text),
    [question?.help_text],
  )
  const openInfo = infoItems.length > 0 ? () => setInfoOpen(true) : undefined

  const otherFollowUp = useMemo(
    () => (question ? findOtherFollowUpForParent(question, questions) : null),
    [question, questions],
  )
  const otherAnswer = otherFollowUp ? answers[otherFollowUp.question_id] : undefined
  const otherText =
    typeof otherAnswer === 'string' || typeof otherAnswer === 'number' ? String(otherAnswer) : ''

  useEffect(() => {
    if (!questionAtIndex) return
    const parent = findParentForOtherFollowUp(questionAtIndex, questions)
    if (!parent) return
    const parentIndex = visibleQuestions.findIndex((item) => item.question_id === parent.question_id)
    if (parentIndex >= 0 && parentIndex !== visibleIndex) {
      setVisibleIndex(parentIndex)
    }
  }, [questionAtIndex, questions, visibleQuestions, visibleIndex])

  const collectSaveIds = (throughIndex: number): number[] => {
    const ids: number[] = []
    for (const item of visibleQuestions.slice(0, throughIndex + 1)) {
      ids.push(item.question_id)
      const followUp = findOtherFollowUpForParent(item, questions)
      if (!followUp) continue
      const parentAnswer = answers[item.question_id]
      const selected = Array.isArray(parentAnswer)
        ? parentAnswer.map(String)
        : typeof parentAnswer === 'string' || typeof parentAnswer === 'number'
          ? [String(parentAnswer)]
          : []
      if (selectedIncludesOther(selected, Array.isArray(item.options) ? item.options : [])) {
        ids.push(followUp.question_id)
      }
    }
    return ids
  }

  const saveCurrentProgress = async () => {
    const answeredThroughIndex = Math.min(visibleIndex, visibleQuestions.length - 1)
    const idsToSave = collectSaveIds(answeredThroughIndex)
    const responses = buildQuestionnaireResponses(
      coerceAnswersForSubmit(answers, questions),
      idsToSave,
      questions,
    )

    if (responses.length === 0) return

    const accessToken = getAccessToken()
    await submitQuestionnaireResponses(
      accessToken,
      assessmentInstanceId,
      categoryId,
      responses,
    )
  }

  const handleBack = () => {
    if (isSaving) return
    if (infoOpen) {
      setInfoOpen(false)
      return
    }
    setSaveError('')
    const previous = adjacentNonInlinedIndex(visibleQuestions, questions, displayIndex, -1)
    if (previous >= 0) {
      setVisibleIndex(previous)
      return
    }
    onDraftChangeRef.current?.(answers, displayIndex)
    void saveCurrentProgress().catch(() => undefined)
    onBack?.()
  }

  const handleNext = async () => {
    if (isSaving || !question || !answered) return

    setSaveError('')
    setIsSaving(true)

    try {
      await saveCurrentProgress()

      if (!isLast) {
        const next = adjacentNonInlinedIndex(visibleQuestions, questions, displayIndex, 1)
        if (next < visibleQuestions.length) {
          setVisibleIndex(next)
          return
        }
      }

      const visibleIds = new Set(collectSaveIds(visibleQuestions.length - 1))
      const pruned: Record<number, AnswerValue> = {}
      for (const [id, value] of Object.entries(answers)) {
        const questionId = Number(id)
        if (visibleIds.has(questionId)) pruned[questionId] = value
      }
      onDraftChangeRef.current?.(pruned, 0)
      onComplete?.(pruned)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save your answer.')
    } finally {
      setIsSaving(false)
    }
  }

  const dietTypeAnswer = useMemo(() => {
    const dietQuestion = questions.find((item) => isNutritionDietTypeQuestion(item))
    if (!dietQuestion) return { dietQuestion: null as QuestionnaireQuestion | null, answer: null as unknown }
    return { dietQuestion, answer: answers[dietQuestion.question_id] ?? null }
  }, [questions, answers])

  const isCurrentFoodGroups = Boolean(question && isNutritionDailyFoodGroupsQuestion(question))
  const rawOptions = Array.isArray(question?.options) ? question.options : []
  const displayedOptions = useMemo(() => {
    if (!isCurrentFoodGroups) return rawOptions
    return filterFoodGroupOptionsByDiet(
      rawOptions,
      dietTypeAnswer.answer,
      dietTypeAnswer.dietQuestion,
    )
  }, [isCurrentFoodGroups, rawOptions, dietTypeAnswer])

  // Drop food-group answers that are no longer allowed for the selected diet.
  useEffect(() => {
    if (!question || !isCurrentFoodGroups) return
    const questionId = question.question_id
    const allowed = new Set(
      displayedOptions.map((option) => getOptionValue(option)).filter(Boolean),
    )
    setAnswers((prev) => {
      const current = prev[questionId]
      if (!Array.isArray(current)) return prev
      const next = current.map(String).filter((value) => allowed.has(value))
      if (next.length === current.length) return prev
      return { ...prev, [questionId]: next }
    })
  }, [question, isCurrentFoodGroups, displayedOptions])

  if (!question || total === 0) {
    return (
      <div className={MCQ_SHELL_CLASS}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-[#9a9a9a]">No questions available for this category.</p>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  const options = displayedOptions
  const multi = isMultiChoiceType(question.question_type)
  const single =
    isSingleChoiceType(question.question_type) ||
    (options.length > 0 && !multi && !isTextType(question.question_type))
  const text = isTextType(question.question_type) || (!single && !multi && options.length === 0)
  const useLocationLayout = isFamilyHistoryLocationQuestion(question)
  const useSitDurationLayout = isLifestyleSitDurationQuestion(question)
  const usePhysicalActivityLayout = isLifestylePhysicalActivityQuestion(question)
  const useWeeklyLeisureLayout = isLifestyleWeeklyLeisureQuestion(question)
  const useActivityIntensityLayout = isLifestyleActivityIntensityQuestion(question)
  const useDailyWalkingLayout = isLifestyleDailyWalkingQuestion(question)
  const useSleepDurationLayout = isLifestyleSleepDurationQuestion(question)
  const useAlcoholConsumptionLayout = isLifestyleAlcoholConsumptionQuestion(question)
  const useSmokingFrequencyLayout = isLifestyleSmokingFrequencyQuestion(question)
  const useWellnessPrioritiesLayout = isLifestyleWellnessPrioritiesQuestion(question)
  const useLifestyleCommitmentLayout = isLifestyleCommitmentQuestion(question)
  const useDietTypeLayout = isNutritionDietTypeQuestion(question)
  const useDailyFoodGroupsLayout = isNutritionDailyFoodGroupsQuestion(question)
  const useBreakfastFrequencyLayout = isNutritionBreakfastFrequencyQuestion(question)
  const useIllnessFrequencyLayout = isNutritionIllnessFrequencyQuestion(question)
  const useWaterIntakeLayout = isNutritionWaterIntakeQuestion(question)
  const useCoffeeTeaTypeLayout = isNutritionCoffeeTeaTypeQuestion(question)
  const useCoffeeTeaIntakeLayout = isNutritionCoffeeTeaIntakeQuestion(question)
  const useIodizedSaltLayout = isNutritionIodizedSaltQuestion(question)
  const useExtraSaltLayout = isNutritionExtraSaltQuestion(question)
  const useConsumptionFrequencyLayout =
    !useBreakfastFrequencyLayout &&
    !useIllnessFrequencyLayout &&
    !useWaterIntakeLayout &&
    isNutritionConsumptionFrequencyQuestion(question)
  const progressColor = THEME_PROGRESS_COLOR[theme]
  const nextGradient = THEME_NEXT_GRADIENT[theme]
  const chipGradient = THEME_CHIP_GRADIENT[theme]
  const nextShadow = THEME_NEXT_SHADOW[theme]

  const selectedValues = Array.isArray(answer)
    ? answer.map(String)
    : typeof answer === 'string' || typeof answer === 'number'
      ? [String(answer)]
      : []

  const applyChoiceSelection = (nextSelected: string[]) => {
    setSaveError('')
    setAnswers((prev) => {
      // Wellness priorities must always POST as a list (min 1 / max 2).
      const storeAsList = multi || useWellnessPrioritiesLayout
      const next: Record<number, AnswerValue> = {
        ...prev,
        [question.question_id]: storeAsList ? nextSelected : (nextSelected[0] ?? ''),
      }

      // Keep typed Other text while Other stays selected; clear only when Other is off.
      if (otherFollowUp && !selectedIncludesOther(nextSelected, options)) {
        delete next[otherFollowUp.question_id]
      }

      return next
    })
  }

  return (
    <div className={MCQ_SHELL_CLASS}>
      <header className="flex shrink-0 items-center px-4 pb-0 pt-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={isSaving}
            className="relative size-6 shrink-0 disabled:opacity-50"
            aria-label="Back"
          >
            <img src={backIcon} alt="" className="absolute inset-0 size-full" aria-hidden />
          </button>
          <h1 className="shrink-0 whitespace-nowrap text-[19px] tracking-[0.095px] text-white">{title}</h1>
        </div>
      </header>

      <div className="flex shrink-0 flex-col gap-2 px-4 py-1">
        <div className="flex w-full items-center justify-end">
          <p className="text-right text-[11px] font-normal uppercase tracking-[0.3px] text-[#8e8ca3] leading-[13.5px]">
            {percent}% COMPLETED
          </p>
        </div>
        <McqProgressBar percent={percent} color={progressColor} />
      </div>

      <div className={MCQ_SHELL_SCROLL_CLASS}>
        <div className="flex flex-col gap-5 pb-4 pt-2">
          {saveError ? (
            <div className="rounded-lg border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 px-3 py-2 text-sm text-[#ffd1d1]">
              {saveError}
            </div>
          ) : null}

          {useLocationLayout ? (
            <FamilyHistoryLocationOptions
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              disabled={Boolean(question.is_read_only) || isSaving}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useSitDurationLayout ? (
            <LifestyleSitDurationQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : usePhysicalActivityLayout ? (
            <LifestylePhysicalActivityQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useWeeklyLeisureLayout ? (
            <LifestyleWeeklyLeisureQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useActivityIntensityLayout ? (
            <LifestyleActivityIntensityQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useDailyWalkingLayout ? (
            <LifestyleDailyWalkingQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useSleepDurationLayout ? (
            <LifestyleSleepDurationQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useSmokingFrequencyLayout ? (
            <LifestyleSmokingFrequencyQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useAlcoholConsumptionLayout ? (
            <LifestyleAlcoholConsumptionQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useWellnessPrioritiesLayout ? (
            <LifestyleWellnessPrioritiesQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValues={selectedValues}
              onInfoClick={openInfo}
              onToggle={(value) => {
                applyChoiceSelection(toggleMulti(selectedValues, value, 2))
              }}
            />
          ) : useLifestyleCommitmentLayout ? (
            <LifestyleCommitmentQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useDietTypeLayout ? (
            <NutritionDietTypeQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              disabled={Boolean(question.is_read_only) || isSaving}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useDailyFoodGroupsLayout || useCoffeeTeaTypeLayout ? (
            <NutritionApiMultiSelectQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={displayedOptions}
              selectedValues={selectedValues}
              onInfoClick={openInfo}
              reserveTickSpaceForSelectedLabels={useCoffeeTeaTypeLayout}
              showFullOptionLabels={useCoffeeTeaTypeLayout}
              onToggle={(value) => {
                setSaveError('')
                applyChoiceSelection(toggleMulti(selectedValues, value))
              }}
            />
          ) : useBreakfastFrequencyLayout ? (
            <NutritionApiCircularMeterQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              meterId={nutritionMeterIdForQuestion(question)}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              variant="breakfast"
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useIllnessFrequencyLayout ? (
            <NutritionApiCircularMeterQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              meterId={nutritionMeterIdForQuestion(question)}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              variant="illness"
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useWaterIntakeLayout ? (
            <NutritionApiWaterIntakeQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useConsumptionFrequencyLayout ? (
            <NutritionApiConsumptionFrequencyQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              meterId={nutritionMeterIdForQuestion(question)}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useIodizedSaltLayout ? (
            <NutritionApiPillRowQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              layout="row"
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : useExtraSaltLayout || useCoffeeTeaIntakeLayout ? (
            <NutritionApiPillRowQuestion
              questionLabel={`Question ${displayIndex + 1} of ${total}`}
              questionText={question.question_text}
              subText={question.sub_text}
              options={options}
              selectedValue={selectedValues[0] ?? null}
              layout={useCoffeeTeaIntakeLayout ? 'coffee-intake' : 'wrap'}
              onInfoClick={openInfo}
              onSelect={(value) => {
                setSaveError('')
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: value,
                }))
              }}
            />
          ) : (
            <>
              <McqQuestionHeader
                theme={theme}
                questionLabel={`Question ${displayIndex + 1} of ${total}`}
                onInfoClick={openInfo}
                titleClassName="mt-2 text-[16px] font-semibold leading-6 tracking-[0.2px] text-white"
              >
                <McqQuestionCopy text={question.question_text} subText={question.sub_text} />
              </McqQuestionHeader>

              {single || multi ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2.5">
                    {options.map((option) => {
                      const value = getOptionValue(option)
                      const label = getOptionLabel(option) || value
                      if (!value && !label) return null
                      const selected = isOptionSelected({ value, label }, selectedValues)

                      return (
                        <button
                          key={`${question.question_id}-${value}`}
                          type="button"
                          disabled={question.is_read_only || isSaving}
                          onClick={() => {
                            if (multi) {
                              applyChoiceSelection(toggleMulti(selectedValues, value))
                              return
                            }
                            applyChoiceSelection([value])
                          }}
                          className={`${MCQ_PILL_CHIP_CLASS} flex items-center justify-center gap-2.5 rounded-full border px-3 py-2 text-left text-[12px] font-medium leading-4 text-white transition disabled:opacity-60`}
                          style={{
                            borderColor: selected ? MCQ_PILL_BORDER_SELECTED : MCQ_PILL_BORDER_IDLE,
                            backgroundImage: selected ? chipGradient : undefined,
                            backgroundColor: selected ? undefined : 'rgba(255,255,255,0.05)',
                          }}
                        >
                          {selected ? (
                            <img src={tickCircleIcon} alt="" className="size-3 shrink-0" aria-hidden />
                          ) : null}
                          <span>{label}</span>
                        </button>
                      )
                    })}
                  </div>
                  {otherFollowUp &&
                  selectedIncludesOther(selectedValues, options) ? (
                    <input
                      type="text"
                      value={otherText}
                      maxLength={OTHER_SPECIFY_MAX_LENGTH}
                      disabled={question.is_read_only || isSaving}
                      onChange={(event) => {
                        setSaveError('')
                        setAnswers((prev) => ({
                          ...prev,
                          [otherFollowUp.question_id]: event.target.value,
                        }))
                      }}
                      placeholder="Please specify (optional)"
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-[16px] font-light leading-6 text-white outline-none placeholder:text-[#9a9a9a] focus:border-white/40 disabled:opacity-60"
                      aria-label={`Please specify for ${otherFollowUp.question_text}`}
                    />
                  ) : null}
                </div>
              ) : null}

              {text ? (
                <textarea
                  value={
                    typeof answer === 'string' || typeof answer === 'number' ? String(answer) : ''
                  }
                  disabled={question.is_read_only || isSaving}
                  onChange={(event) => {
                    setSaveError('')
                    setAnswers((prev) => ({
                      ...prev,
                      [question.question_id]: event.target.value,
                    }))
                  }}
                  rows={4}
                  placeholder="Type your answer"
                  className="w-full resize-none rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-[16px] text-white outline-none placeholder:text-white/35 focus:ring-1 focus:ring-[#9D50BB] disabled:opacity-60"
                />
              ) : null}
            </>
          )}
        </div>
      </div>

      <McqInfoOverlay
        open={infoOpen}
        items={infoItems}
        theme={theme}
        onClose={() => setInfoOpen(false)}
      />

      <footer className={MCQ_SHELL_FOOTER_CLASS}>
        <div className={`${MCQ_SHELL_FOOTER_INNER_CLASS}${isLast ? ' justify-end' : ''}`}>
          {!isLast ? (
            <div className="min-w-0 max-w-[200px] flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[1.1px] leading-[14px] text-[rgba(255,255,255,0.4)]">
                NEXT QUESTION
              </p>
              <p className="mt-0.5 overflow-hidden whitespace-nowrap text-[13px] font-medium leading-[18px] text-[rgba(255,255,255,0.6)]">
                {formatNextQuestionPreview(nextPreview.line1, nextPreview.line2)}
              </p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleNext}
            disabled={isSaving || !answered}
            className={`flex size-10 shrink-0 items-center justify-center rounded-full border border-solid border-[#969696] p-px ${nextShadow} disabled:cursor-not-allowed disabled:opacity-40`}
            style={{ backgroundImage: nextGradient }}
            aria-label={
              isSaving
                ? 'Saving answer'
                : !answered
                  ? 'Answer this question to continue'
                  : 'Next question'
            }
          >
            <img src={nextChevronIcon} alt="" className="size-4" aria-hidden />
          </button>
        </div>
      </footer>
    </div>
  )
}
