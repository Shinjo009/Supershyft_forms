import type { QuestionnaireQuestion } from '../api/questionnaire'
import { buildNavigableQuestionnaireQuestions } from './apiOtherFollowUps'
import { seedAnswersFromQuestions, type AnswerValue } from './questionnaireVisibility'

export type AssessmentResume = {
  phone: string
  email: string
  assessmentInstanceId: number | null
  previewAvailable: boolean
}

function storageKey(campCode: string): string {
  return `supershyft.assessmentResume.${campCode}`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readPhone(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '').slice(-10) : ''
}

function hasAnswerValue(answer: AnswerValue | undefined): boolean {
  if (answer == null) return false
  if (Array.isArray(answer)) return answer.length > 0
  if (typeof answer === 'object') return Object.keys(answer).length > 0
  return String(answer).trim().length > 0
}

export function readAssessmentResume(campCode: string): AssessmentResume | null {
  if (typeof window === 'undefined' || !campCode) return null
  try {
    const raw = window.localStorage.getItem(storageKey(campCode))
    if (!raw) return null
    const parsed = asRecord(JSON.parse(raw) as unknown)
    if (!parsed) return null
    const phone = readPhone(parsed.phone)
    if (!phone) return null
    const instanceId = Number(parsed.assessmentInstanceId)
    return {
      phone,
      email: typeof parsed.email === 'string' ? parsed.email.trim() : '',
      assessmentInstanceId: Number.isFinite(instanceId) && instanceId > 0 ? instanceId : null,
      previewAvailable: parsed.previewAvailable === true,
    }
  } catch {
    return null
  }
}

export function writeAssessmentResume(campCode: string, resume: AssessmentResume): void {
  if (typeof window === 'undefined' || !campCode) return
  try {
    window.localStorage.setItem(storageKey(campCode), JSON.stringify(resume))
  } catch {
    // Quota or private-mode restrictions — resume is best-effort.
  }
}

export function clearAssessmentResume(campCode: string): void {
  if (typeof window === 'undefined' || !campCode) return
  try {
    window.localStorage.removeItem(storageKey(campCode))
  } catch {
    // ignore
  }
}

export function hasSavedAnswers(questions: QuestionnaireQuestion[]): boolean {
  const answers = seedAnswersFromQuestions(questions)
  return Object.values(answers).some(hasAnswerValue)
}

/** First one-at-a-time question that still has no saved answer. */
export function firstUnansweredNavigableIndex(questions: QuestionnaireQuestion[]): number {
  const answers = seedAnswersFromQuestions(questions)
  const visible = buildNavigableQuestionnaireQuestions(questions, answers)
  const index = visible.findIndex(
    (question) => !question.is_read_only && !hasAnswerValue(answers[question.question_id]),
  )
  return index < 0 ? 0 : index
}
