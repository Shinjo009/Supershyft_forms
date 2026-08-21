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
  data?: CategoryQuestionnaire & {
    items?: QuestionnaireQuestion[]
    responses?: Array<{ question_id?: number; id?: number; answer?: unknown; value?: unknown }>
    answers?: Array<{ question_id?: number; id?: number; answer?: unknown; value?: unknown }>
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asQuestionList(value: unknown): QuestionnaireQuestion[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is QuestionnaireQuestion => {
    if (!item || typeof item !== 'object') return false
    const row = item as QuestionnaireQuestion
    return Number(row.question_id) > 0 || Boolean(row.question_text)
  })
}

function extractQuestionnaireQuestions(payload: unknown): QuestionnaireQuestion[] {
  const root = asRecord(payload)
  if (!root) return []
  const data = asRecord(root.data) ?? root
  const nested = asRecord(data.data)
  const questionnaire = asRecord(data.questionnaire)

  const buckets = [
    data.questions,
    root.questions,
    data.items,
    questionnaire?.questions,
    nested?.questions,
    data.answered_questions,
    data.category_questions,
  ]
  for (const bucket of buckets) {
    const questions = asQuestionList(bucket)
    if (questions.length > 0) return questions
  }
  return []
}

function extractResponseMap(payload: unknown): Record<number, unknown> {
  const root = asRecord(payload)
  if (!root) return {}
  const data = asRecord(root.data) ?? root
  const lists = [data.responses, data.answers, root.responses, root.answers]
  const mapped: Record<number, unknown> = {}
  for (const list of lists) {
    if (!Array.isArray(list)) continue
    for (const item of list) {
      const row = asRecord(item)
      if (!row) continue
      const id = Number(row.question_id ?? row.id)
      if (!Number.isFinite(id) || id <= 0) continue
      const answer = row.answer ?? row.value ?? row.response
      if (answer !== undefined) mapped[id] = answer
    }
  }
  return mapped
}

function mergeInlineAnswers(
  questions: QuestionnaireQuestion[],
  answersById: Record<number, unknown>,
): QuestionnaireQuestion[] {
  if (Object.keys(answersById).length === 0) return questions
  return questions.map((question) => {
    if (!isEmptyAnswer(question.answer)) return question
    const fromResponses = answersById[question.question_id]
    if (isEmptyAnswer(fromResponses)) return question
    return { ...question, answer: fromResponses }
  })
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

  const questions = mergeInlineAnswers(
    extractQuestionnaireQuestions(response),
    extractResponseMap(response),
  )
  const data = asRecord(asRecord(response)?.data) ?? asRecord(response) ?? {}

  return {
    ...(data as CategoryQuestionnaire),
    questions,
  }
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
  return type === 'text' || type === 'textarea' || type === 'string' || type === 'long_text'
}

export function isScaleType(questionType: string): boolean {
  const type = String(questionType || '')
    .trim()
    .toLowerCase()
  return type === 'scale' || type === 'numeric_scale'
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
