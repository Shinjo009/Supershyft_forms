import { useEffect, useMemo, useState } from 'react'
import backIcon from '../assets/family-history/back-icon.svg'
import nextChevronIcon from '../assets/family-history/next-chevron.svg'
import {
  buildQuestionnaireResponses,
  getOptionLabel,
  getOptionValue,
  isMultiChoiceType,
  isSingleChoiceType,
  isTextType,
  submitQuestionnaireResponses,
  type QuestionnaireQuestion,
} from '../api/questionnaire'
import { getAccessToken } from '../lib/authStorage'
import {
  filterVisibleQuestions,
  seedAnswersFromQuestions,
  type AnswerValue,
} from '../lib/questionnaireVisibility'
import {
  formatNextQuestionPreview,
  MCQ_PILL_BORDER_IDLE,
  MCQ_PILL_BORDER_SELECTED,
  MCQ_PILL_CHIP_CLASS,
  MCQ_QUESTION_HINT_CLASS,
  MCQ_SHELL_CLASS,
  MCQ_SHELL_FOOTER_INNER_CLASS,
  MCQ_SHELL_SCROLL_CLASS,
} from './mcq/mcqLayout'
import { McqProgressBar } from './mcq/McqProgressBar'

const NEXT_BUTTON_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.3'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(2.5 0 0 2.5 25 25)'><stop stop-color='rgba(164,86,234,1)' offset='0'/><stop stop-color='rgba(134,69,194,1)' offset='0.25'/><stop stop-color='rgba(103,52,153,1)' offset='0.5'/><stop stop-color='rgba(73,35,113,1)' offset='0.75'/><stop stop-color='rgba(42,18,72,1)' offset='1'/></radialGradient></defs></svg>\")"

const CHIP_SELECTED_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 155 36' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.35'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(7.75 0 0 1.8 77.5 18)'><stop stop-color='rgba(164,86,234,1)' offset='0'/><stop stop-color='rgba(134,69,194,1)' offset='0.25'/><stop stop-color='rgba(103,52,153,1)' offset='0.5'/><stop stop-color='rgba(73,35,113,1)' offset='0.75'/><stop stop-color='rgba(42,18,72,1)' offset='1'/></radialGradient></defs></svg>\")"

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

function toggleMulti(current: string[], value: string): string[] {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'none') {
    return current.includes(value) ? [] : [value]
  }
  const withoutNone = current.filter((item) => item.trim().toLowerCase() !== 'none')
  if (withoutNone.includes(value)) {
    return withoutNone.filter((item) => item !== value)
  }
  return [...withoutNone, value]
}

function isAnswered(question: QuestionnaireQuestion, answer: AnswerValue | undefined): boolean {
  if (answer == null) return !question.is_required
  if (Array.isArray(answer)) return answer.length > 0 || !question.is_required
  if (typeof answer === 'object') return Object.keys(answer).length > 0 || !question.is_required
  return String(answer).trim().length > 0 || !question.is_required
}

export function ApiQuestionnaireStep({
  title,
  questions,
  assessmentInstanceId,
  categoryId,
  onBack,
  onComplete,
}: {
  title: string
  questions: QuestionnaireQuestion[]
  assessmentInstanceId: number
  categoryId: number
  onBack?: () => void
  onComplete?: (answers: Record<number, AnswerValue>) => void
}) {
  const [visibleIndex, setVisibleIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>(() =>
    seedAnswersFromQuestions(questions),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    setAnswers(seedAnswersFromQuestions(questions))
    setVisibleIndex(0)
    setSaveError('')
  }, [questions])

  const visibleQuestions = useMemo(
    () => filterVisibleQuestions(questions, answers),
    [questions, answers],
  )

  useEffect(() => {
    if (visibleQuestions.length === 0) {
      setVisibleIndex(0)
      return
    }
    setVisibleIndex((current) => Math.min(current, visibleQuestions.length - 1))
  }, [visibleQuestions])

  const total = visibleQuestions.length
  const question = visibleQuestions[visibleIndex]
  const nextQuestion = visibleQuestions[visibleIndex + 1]
  const answer = question ? answers[question.question_id] : undefined
  const answered = question ? isAnswered(question, answer) : false
  const percent = progressPercent(visibleIndex, total, answered)
  const isLast = visibleIndex >= total - 1
  const nextPreview = useMemo(
    () => splitPreview(nextQuestion?.question_text || ''),
    [nextQuestion?.question_text],
  )

  const saveCurrentProgress = async () => {
    const answeredThroughIndex = Math.min(visibleIndex, visibleQuestions.length - 1)
    const idsToSave = visibleQuestions
      .slice(0, answeredThroughIndex + 1)
      .map((item) => item.question_id)
    const responses = buildQuestionnaireResponses(answers, idsToSave)

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
    setSaveError('')
    if (visibleIndex > 0) {
      setVisibleIndex((index) => index - 1)
      return
    }
    onBack?.()
  }

  const handleNext = async () => {
    if (isSaving || !question) return

    setSaveError('')
    setIsSaving(true)

    try {
      await saveCurrentProgress()

      if (!isLast) {
        setVisibleIndex((index) => index + 1)
        return
      }

      const visibleIds = new Set(visibleQuestions.map((item) => item.question_id))
      const pruned: Record<number, AnswerValue> = {}
      for (const [id, value] of Object.entries(answers)) {
        const questionId = Number(id)
        if (visibleIds.has(questionId)) pruned[questionId] = value
      }
      onComplete?.(pruned)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save your answer.')
    } finally {
      setIsSaving(false)
    }
  }

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

  const options = Array.isArray(question.options) ? question.options : []
  const multi = isMultiChoiceType(question.question_type)
  const single =
    isSingleChoiceType(question.question_type) ||
    (options.length > 0 && !multi && !isTextType(question.question_type))
  const text = isTextType(question.question_type) || (!single && !multi && options.length === 0)

  const selectedValues = Array.isArray(answer)
    ? answer.map(String)
    : typeof answer === 'string' || typeof answer === 'number'
      ? [String(answer)]
      : []

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
        <McqProgressBar percent={percent} color="#9D50BB" />
      </div>

      <div className={MCQ_SHELL_SCROLL_CLASS}>
        <div className="flex flex-col gap-5 pb-4 pt-2">
          <div>
            <h2 className="text-[16px] font-semibold leading-6 tracking-[0.2px] text-white">
              {question.question_text}
            </h2>
            {question.help_text ? <p className={MCQ_QUESTION_HINT_CLASS}>{question.help_text}</p> : null}
            {question.is_required === false ? (
              <p className={MCQ_QUESTION_HINT_CLASS}>Optional</p>
            ) : null}
          </div>

          {saveError ? (
            <div className="rounded-lg border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 px-3 py-2 text-sm text-[#ffd1d1]">
              {saveError}
            </div>
          ) : null}

          {single || multi ? (
            <div className="flex flex-wrap gap-2.5">
              {options.map((option) => {
                const value = getOptionValue(option)
                const label = getOptionLabel(option) || value
                if (!value && !label) return null
                const selected = selectedValues.includes(value)
                return (
                  <button
                    key={`${question.question_id}-${value}`}
                    type="button"
                    disabled={question.is_read_only || isSaving}
                    onClick={() => {
                      setSaveError('')
                      if (multi) {
                        setAnswers((prev) => ({
                          ...prev,
                          [question.question_id]: toggleMulti(selectedValues, value),
                        }))
                        return
                      }
                      setAnswers((prev) => ({
                        ...prev,
                        [question.question_id]: value,
                      }))
                    }}
                    className={`${MCQ_PILL_CHIP_CLASS} rounded-full border px-3 py-2 text-left text-[12px] font-medium leading-4 text-white transition disabled:opacity-60`}
                    style={{
                      borderColor: selected ? MCQ_PILL_BORDER_SELECTED : MCQ_PILL_BORDER_IDLE,
                      backgroundImage: selected ? CHIP_SELECTED_GRADIENT : undefined,
                      backgroundColor: selected ? undefined : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          ) : null}

          {text ? (
            <textarea
              value={typeof answer === 'string' || typeof answer === 'number' ? String(answer) : ''}
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
              className="w-full resize-none rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/35 focus:ring-1 focus:ring-[#9D50BB] disabled:opacity-60"
            />
          ) : null}
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-10 bg-[rgba(255,255,255,0.05)] backdrop-blur-[25px]">
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
            disabled={isSaving}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-solid border-[#969696] p-px shadow-[0_8px_32px_0_rgba(164,86,234,0.25)] disabled:opacity-60"
            style={{ backgroundImage: NEXT_BUTTON_GRADIENT }}
            aria-label={isSaving ? 'Saving answer' : 'Next question'}
          >
            <img src={nextChevronIcon} alt="" className="size-4" aria-hidden />
          </button>
        </div>
      </footer>
    </div>
  )
}
