import { isFrontendOnly } from '../lib/frontendOnly'
import { authorizedGet, authorizedPut } from './http'

export type QuestionnaireOption = {
  option_id?: number
  option_value?: string
  display_name?: string
  label?: string
  value?: string
  tooltip_text?: string | null
  sort_order?: number
}

export type QuestionnaireQuestion = {
  question_id: number
  question_text: string
  question_type: string
  question_key?: string
  category_id?: number
  is_required?: boolean
  is_read_only?: boolean
  help_text?: string | null
  /** Optional helper line shown directly under the question title. */
  sub_text?: string | null
  options?: QuestionnaireOption[] | null
  visibility_rules?: {
    match?: string
    conditions?: Array<{
      type?: string
      operator?: string
      question_key?: string
      preference_key?: string
      value?: unknown
    }>
  } | null
  prefill_from?: unknown
  is_visible?: boolean
  visibility_reason?: string | null
  answer_source?: string
  answer?: unknown
}

export type CategoryQuestionnaire = {
  assessment_instance_id: number
  assessment_package?: string
  category?: string
  assessment_status?: string
  category_status?: string
  questions: QuestionnaireQuestion[]
}

export type QuestionnaireResponseItem = {
  question_id: number
  answer: string | string[] | { value: number; unit: string }
}

type CategoryQuestionnaireResponse = {
  data?: CategoryQuestionnaire
}

function isEmptyAnswer(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'string' && value.trim() === '') return true
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if ('value' in record) {
      return !Number.isFinite(Number(record.value))
    }
    return Object.keys(record).length === 0
  }
  return false
}

function normalizeScaleAnswer(answer: Record<string, unknown>): { value: number; unit: string } | null {
  const value = Number(answer.value ?? answer.answer ?? answer.response)
  const unit = String(answer.unit ?? answer.units ?? '').trim()
  if (!Number.isFinite(value) || !unit) return null
  return { value, unit }
}

/** Normalize local answer values into the PUT /responses payload shape. */
export function normalizeOutgoingAnswer(
  answer: unknown,
): string | string[] | { value: number; unit: string } | null {
  if (answer == null) return null

  if (Array.isArray(answer)) {
    const values = answer.map((item) => String(item ?? '').trim()).filter(Boolean)
    return values.length > 0 ? values : null
  }

  if (typeof answer === 'object') {
    return normalizeScaleAnswer(answer as Record<string, unknown>)
  }

  if (typeof answer === 'boolean') return answer ? 'true' : 'false'
  if (typeof answer === 'number') return Number.isFinite(answer) ? String(answer) : null

  const text = String(answer).trim()
  return text || null
}

export function buildQuestionnaireResponses(
  answersById: Record<number, unknown>,
  questionIds?: number[],
): QuestionnaireResponseItem[] {
  const ids = questionIds ?? Object.keys(answersById).map((id) => Number(id))
  const responses: QuestionnaireResponseItem[] = []

  for (const questionId of ids) {
    if (!Number.isFinite(questionId) || questionId <= 0) continue
    const normalized = normalizeOutgoingAnswer(answersById[questionId])
    if (normalized == null || isEmptyAnswer(normalized)) continue
    responses.push({ question_id: questionId, answer: normalized })
  }

  return responses
}

export function getOptionLabel(option: QuestionnaireOption): string {
  return String(option.display_name || option.label || option.option_value || option.value || '').trim()
}

export function getOptionValue(option: QuestionnaireOption): string {
  return String(option.option_value ?? option.value ?? option.display_name ?? option.label ?? '').trim()
}

export function isMultiChoiceType(questionType: string): boolean {
  const type = String(questionType || '')
    .trim()
    .toLowerCase()
  return (
    type === 'multi_choice' ||
    type === 'multiple_choice' ||
    type === 'multi_select' ||
    type === 'checkbox'
  )
}

export function isSingleChoiceType(questionType: string): boolean {
  const type = String(questionType || '')
    .trim()
    .toLowerCase()
  return (
    type === 'single_choice' ||
    type === 'choice' ||
    type === 'radio' ||
    type === 'single_select' ||
    type === 'select_one' ||
    type === 'dropdown'
  )
}

export function isTextType(questionType: string): boolean {
  const type = String(questionType || '')
    .trim()
    .toLowerCase()
  return (
    type === 'text' ||
    type === 'textarea' ||
    type === 'string' ||
    type === 'long_text' ||
    type === 'short_text' ||
    type === 'free_text' ||
    type === 'open_text' ||
    type === 'input'
  )
}

export function isScaleType(questionType: string): boolean {
  const type = String(questionType || '')
    .trim()
    .toLowerCase()
  return type === 'scale' || type === 'numeric_scale'
}

export async function getCategoryQuestionnaire(
  accessToken: string,
  assessmentInstanceId: number,
  categoryId: number,
): Promise<CategoryQuestionnaire> {
  const response = await authorizedGet<CategoryQuestionnaireResponse>(
    `/questionnaire/${assessmentInstanceId}/category/${categoryId}`,
    accessToken,
  )

  const data = response?.data
  if (!data || !Array.isArray(data.questions)) {
    throw new Error('Questionnaire response did not include questions.')
  }

  return {
    ...data,
    questions: data.questions,
  }
}

export async function submitQuestionnaireResponses(
  accessToken: string,
  assessmentInstanceId: number,
  categoryId: number,
  responses: QuestionnaireResponseItem[],
): Promise<unknown> {
  if (!Array.isArray(responses) || responses.length === 0) {
    return null
  }

  if (isFrontendOnly()) {
    console.info('[frontend-only] skipped questionnaire submit', {
      assessmentInstanceId,
      categoryId,
      responseCount: responses.length,
    })
    return null
  }

  return authorizedPut(
    `/questionnaire/${assessmentInstanceId}/category/${categoryId}/responses`,
    accessToken,
    { responses },
  )
}
