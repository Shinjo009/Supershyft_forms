import type { QuestionnaireOption, QuestionnaireQuestion } from '../api/questionnaire'
import { getOptionLabel, getOptionValue, isMultiChoiceType } from '../api/questionnaire'

export type VisibilityCondition = {
  type?: string
  operator?: string
  question_key?: string
  question_id?: number
  source_question_key?: string
  source_question_id?: number
  preference_key?: string
  value?: unknown
}

export type VisibilityRules = {
  match?: string
  conditions?: VisibilityCondition[]
}

export type AnswerValue = string | string[] | number | Record<string, unknown>

function isEmptyAnswer(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'string' && value.trim() === '') return true
  return false
}

function normalizeQuestionKey(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function normalizeRuleText(value: unknown): string {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map((item) => normalizeRuleText(item)).join(',')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value).trim().toLowerCase()
}

function normalizeAnswerForRules(question: QuestionnaireQuestion, answer: unknown): unknown {
  if (isEmptyAnswer(answer)) return answer

  const opts = Array.isArray(question.options) ? question.options : []
  if (opts.length === 0) return answer

  const normalizePiece = (piece: unknown) => {
    if (piece == null || (typeof piece === 'object' && !Array.isArray(piece))) return piece
    const raw = String(piece).trim()
    if (!raw) return piece

    const matched = opts.find((option: QuestionnaireOption) => {
      const stored = getOptionValue(option)
      const display = getOptionLabel(option)
      return (
        (stored !== '' && normalizeRuleText(stored) === normalizeRuleText(raw)) ||
        (display !== '' && normalizeRuleText(display) === normalizeRuleText(raw))
      )
    })

    if (!matched) return piece
    const stored = getOptionValue(matched)
    return stored !== '' ? stored : getOptionLabel(matched) || piece
  }

  if (Array.isArray(answer)) return answer.map((item) => normalizePiece(item))
  return normalizePiece(answer)
}

function isNoneSelection(value: unknown): boolean {
  const token = normalizeRuleText(value)
  return (
    token === 'none' ||
    token === 'no' ||
    token.startsWith('none_') ||
    token.includes('none of')
  )
}

function optionTokens(option: QuestionnaireOption): string[] {
  return [getOptionValue(option), getOptionLabel(option), option.option_id]
    .map((item) => normalizeRuleText(item))
    .filter(Boolean)
}

function tokensForValue(value: unknown, question?: QuestionnaireQuestion): Set<string> {
  const tokens = new Set<string>()
  const options = Array.isArray(question?.options) ? question.options : []

  const add = (raw: unknown) => {
    if (raw == null || (typeof raw === 'object' && !Array.isArray(raw))) return
    const text = normalizeRuleText(raw)
    if (!text) return
    tokens.add(text)
    if (isNoneSelection(text)) tokens.add('none')

    for (const option of options) {
      const optTokens = optionTokens(option)
      if (!optTokens.includes(text)) continue
      for (const token of optTokens) tokens.add(token)
      if (optTokens.some((token) => isNoneSelection(token))) tokens.add('none')
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) add(item)
  } else {
    add(value)
  }
  return tokens
}

function selectionsOverlap(
  actual: unknown,
  expected: unknown,
  question?: QuestionnaireQuestion,
): boolean {
  const actualTokens = tokensForValue(actual, question)
  const expectedTokens = tokensForValue(expected, question)
  if (actualTokens.size === 0 || expectedTokens.size === 0) return false
  for (const token of actualTokens) {
    if (expectedTokens.has(token)) return true
  }
  return false
}

function normalizeOperator(operator: string): string {
  const raw = String(operator || 'equals')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  if (['equals', 'eq', '==', 'is', 'equal'].includes(raw)) return 'equals'
  if (
    ['not_equals', 'ne', 'neq', '!=', '<>', 'is_not', 'not_equal', 'does_not_equal'].includes(raw)
  ) {
    return 'not_equals'
  }
  if (['contains', 'includes', 'has'].includes(raw)) return 'contains'
  if (['not_contains', 'excludes', 'does_not_contain', 'not_includes'].includes(raw)) {
    return 'not_contains'
  }
  if (['in', 'any_of', 'one_of'].includes(raw)) return 'in'
  if (['not_in', 'none_of', 'nin'].includes(raw)) return 'not_in'
  return raw
}

function matchesOperator(
  actual: unknown,
  expected: unknown,
  operator: string,
  parentQuestion?: QuestionnaireQuestion,
): boolean {
  const op = normalizeOperator(operator)
  const expectedList = Array.isArray(expected) ? expected : [expected]

  if (op === 'equals') {
    return selectionsOverlap(actual, expected, parentQuestion)
  }

  if (op === 'contains') {
    if (selectionsOverlap(actual, expected, parentQuestion)) return true
    if (!Array.isArray(actual) && !Array.isArray(expected)) {
      const needle = normalizeRuleText(expected)
      return needle !== '' && normalizeRuleText(actual).includes(needle)
    }
    return false
  }

  if (op === 'not_equals' || op === 'not_contains') {
    if (isEmptyAnswer(actual)) return false
    return !selectionsOverlap(actual, expected, parentQuestion)
  }

  if (op === 'in') {
    return expectedList.some((item) => selectionsOverlap(actual, item, parentQuestion))
  }

  if (op === 'not_in') {
    if (isEmptyAnswer(actual)) return false
    return !expectedList.some((item) => selectionsOverlap(actual, item, parentQuestion))
  }

  return false
}

function isQuestionAnswerCondition(condition: VisibilityCondition): boolean {
  const type = String(condition.type || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  if (
    type &&
    type !== 'question_answer' &&
    type !== 'question' &&
    type !== 'answer' &&
    type !== 'depends_on' &&
    type !== 'dependency'
  ) {
    return Boolean(conditionQuestionKey(condition) || conditionQuestionId(condition))
  }
  return Boolean(
    !type ||
      type === 'question_answer' ||
      type === 'question' ||
      type === 'answer' ||
      type === 'depends_on' ||
      type === 'dependency' ||
      conditionQuestionKey(condition) ||
      conditionQuestionId(condition),
  )
}

function conditionQuestionKey(condition: VisibilityCondition): string {
  const record = condition as VisibilityCondition & Record<string, unknown>
  return String(
    condition.question_key ||
      condition.source_question_key ||
      record.depends_on ||
      record.target_question_key ||
      '',
  )
    .trim()
    .toLowerCase()
}

function conditionQuestionId(condition: VisibilityCondition): number {
  const record = condition as VisibilityCondition & Record<string, unknown>
  const id = Number(
    condition.question_id || condition.source_question_id || record.source_question_id || 0,
  )
  return Number.isFinite(id) && id > 0 ? id : 0
}

/** Accept the API's visibility_rules object, array, JSON string, or single condition. */
export function parseVisibilityRules(raw: unknown): VisibilityRules | null {
  if (raw == null) return null

  let value: unknown = raw
  if (typeof value === 'string') {
    const text = value.trim()
    if (!text) return null
    try {
      value = JSON.parse(text)
    } catch {
      return null
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? { match: 'all', conditions: value as VisibilityCondition[] } : null
  }

  if (typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const match = String(record.match || record.logic || 'all')
  const nested = record.conditions ?? record.rules ?? record.rule ?? record.condition

  if (Array.isArray(nested)) {
    return nested.length > 0 ? { match, conditions: nested as VisibilityCondition[] } : null
  }
  if (nested && typeof nested === 'object') {
    return { match, conditions: [nested as VisibilityCondition] }
  }
  if (
    record.question_key ||
    record.question_id ||
    record.operator ||
    record.source_question_key ||
    record.value !== undefined
  ) {
    return { match, conditions: [record as VisibilityCondition] }
  }
  return null
}

function readRawVisibilityRules(question: QuestionnaireQuestion): unknown {
  const record = question as QuestionnaireQuestion & Record<string, unknown>
  return (
    question.visibility_rules ??
    record.visibility_rule ??
    record.visibility ??
    record.visible_when ??
    record.show_if ??
    record.showIf
  )
}

export function visibilityRulesForQuestion(question: QuestionnaireQuestion): VisibilityRules | null {
  return parseVisibilityRules(readRawVisibilityRules(question))
}

export function evaluateVisibilityRules(
  visibilityRules: VisibilityRules | null | undefined,
  answersByQuestionKey: Record<string, unknown>,
  allQuestions: QuestionnaireQuestion[] = [],
): boolean {
  const parsed = parseVisibilityRules(visibilityRules)
  if (!parsed) return true

  const conditions = parsed.conditions
  if (!Array.isArray(conditions) || conditions.length === 0) return true

  const matchMode = String(parsed.match || 'all').trim().toLowerCase()
  const results = conditions.map((condition) => {
    if (!condition || typeof condition !== 'object') return false
    if (!isQuestionAnswerCondition(condition)) return false

    const questionKey = conditionQuestionKey(condition)
    const questionId = conditionQuestionId(condition)
    const parent = allQuestions.find(
      (item) =>
        (questionKey && normalizeQuestionKey(item.question_key) === questionKey) ||
        (questionId > 0 && Number(item.question_id) === questionId),
    )
    const actual =
      (questionKey ? answersByQuestionKey[questionKey] : undefined) ??
      (questionId > 0 ? answersByQuestionKey[`id:${questionId}`] : undefined) ??
      (parent ? answersByQuestionKey[normalizeQuestionKey(parent.question_key)] : undefined)

    return matchesOperator(actual, condition.value, String(condition.operator || 'equals'), parent)
  })

  return matchMode === 'any' ? results.some(Boolean) : results.every(Boolean)
}

function readInlineAnswer(question: QuestionnaireQuestion): unknown {
  return isEmptyAnswer(question.answer) ? null : question.answer
}

function coerceStoredAnswer(question: QuestionnaireQuestion, raw: unknown): AnswerValue | undefined {
  if (isEmptyAnswer(raw)) return undefined

  if (isMultiChoiceType(question.question_type)) {
    if (Array.isArray(raw)) {
      return raw.map((item) => String(item ?? '').trim()).filter(Boolean)
    }
    return [String(raw).trim()].filter(Boolean)
  }

  if (Array.isArray(raw)) {
    return String(raw[0] ?? '').trim()
  }

  if (typeof raw === 'object') {
    return raw as Record<string, unknown>
  }

  return String(raw)
}

/** Seed local answers from API `answer` fields when present. */
export function seedAnswersFromQuestions(
  questions: QuestionnaireQuestion[],
): Record<number, AnswerValue> {
  const seeded: Record<number, AnswerValue> = {}
  for (const question of questions) {
    const value = coerceStoredAnswer(question, readInlineAnswer(question))
    if (value !== undefined) {
      seeded[question.question_id] = value
    }
  }
  return seeded
}

/** Overlay in-progress drafts on top of API-seeded answers. Draft wins for any question it contains. */
export function mergeDraftAnswers(
  seeded: Record<number, AnswerValue>,
  draft?: Record<number, AnswerValue>,
): Record<number, AnswerValue> {
  if (!draft || Object.keys(draft).length === 0) return { ...seeded }
  return { ...seeded, ...draft }
}

/** Write draft answers onto question.answer so a later reload still seeds them. */
export function applyAnswersToQuestions(
  questions: QuestionnaireQuestion[],
  answers?: Record<number, AnswerValue>,
): QuestionnaireQuestion[] {
  if (!answers || Object.keys(answers).length === 0) return questions
  return questions.map((question) => {
    const answer = answers[question.question_id]
    return answer === undefined ? question : { ...question, answer }
  })
}

function answerIsNone(actual: unknown, question?: QuestionnaireQuestion): boolean {
  if (isEmptyAnswer(actual)) return false
  const items = Array.isArray(actual) ? actual : [actual]
  if (items.length === 0) return false
  return items.every((item) => {
    if (tokensForValue(item, question).has('none')) return true
    return isNoneSelection(item)
  })
}

function isDiagnosedDiseasesMedicationsQuestion(question: QuestionnaireQuestion): boolean {
  const key = normalizeQuestionKey(question.question_key)
  const text = normalizeQuestionKey(question.question_text)
  if (key.endsWith('_other') && !key.includes('medication')) return false
  if (
    key === 'diagnosed_diseases_medications' ||
    key === 'medications' ||
    key.includes('diagnosed_diseases_medication') ||
    (key.includes('medication') && !key.includes('relative'))
  ) {
    return true
  }
  return text.includes('taking medications') && text.includes('disease')
}

function findDiagnosedDiseasesQuestion(
  questions: QuestionnaireQuestion[],
): QuestionnaireQuestion | undefined {
  const byKey = questions.find((item) => {
    const key = normalizeQuestionKey(item.question_key)
    if (key.endsWith('_other') || key.includes('medication')) return false
    return (
      key === 'diagnosed_diseases' ||
      key === 'personal_diagnoses' ||
      key === 'diagnosed_disease' ||
      key.includes('diagnos')
    )
  })
  if (byKey) return byKey

  return questions.find((item) => {
    const key = normalizeQuestionKey(item.question_key)
    const text = normalizeQuestionKey(item.question_text)
    if (key.endsWith('_other') || key.includes('medication')) return false
    if (text.includes('taking medications')) return false
    return text.includes('diagnosed') && text.includes('disease')
  })
}

/**
 * Resolve whether a question should show:
 * - no `visibility_rules` → always show
 * - has `visibility_rules` → evaluate match/conditions against answers
 * - Family History medications stay hidden when diagnosed diseases is None
 */
export function isQuestionVisible(
  question: QuestionnaireQuestion,
  answersByQuestionKey: Record<string, unknown>,
  allQuestions: QuestionnaireQuestion[] = [],
): boolean {
  const diagnosed = findDiagnosedDiseasesQuestion(allQuestions)
  const diagnosedAnswer =
    (diagnosed
      ? answersByQuestionKey[normalizeQuestionKey(diagnosed.question_key)] ??
        answersByQuestionKey[`id:${diagnosed.question_id}`]
      : undefined) ?? answersByQuestionKey.diagnosed_diseases ?? answersByQuestionKey.personal_diagnoses

  if (
    diagnosed &&
    isDiagnosedDiseasesMedicationsQuestion(question) &&
    answerIsNone(diagnosedAnswer, diagnosed)
  ) {
    return false
  }

  const parsed = parseVisibilityRules(readRawVisibilityRules(question))
  if (!parsed) return true

  return evaluateVisibilityRules(parsed, answersByQuestionKey, allQuestions)
}

export function buildAnswersByQuestionKey(
  questions: QuestionnaireQuestion[],
  answersById: Record<number, AnswerValue>,
  excludeQuestionId?: number,
): Record<string, unknown> {
  const byKey: Record<string, unknown> = {}

  for (const prior of questions) {
    if (excludeQuestionId != null && Number(prior.question_id) === Number(excludeQuestionId)) {
      continue
    }
    const key = String(prior?.question_key || '')
      .trim()
      .toLowerCase()

    const fromState = answersById[prior.question_id]
    const raw = !isEmptyAnswer(fromState) ? fromState : readInlineAnswer(prior)
    if (isEmptyAnswer(raw)) continue

    const normalized = normalizeAnswerForRules(prior, raw)
    if (key) byKey[key] = normalized
    byKey[`id:${prior.question_id}`] = normalized
  }

  return byKey
}

/** Recompute visibility for every question using live answers, regardless of API order. */
export function computeQuestionsWithVisibility(
  questions: QuestionnaireQuestion[],
  answersById: Record<number, AnswerValue>,
): QuestionnaireQuestion[] {
  return questions.map((question) => {
    const answersByKey = buildAnswersByQuestionKey(questions, answersById, question.question_id)
    return {
      ...question,
      is_visible: isQuestionVisible(question, answersByKey, questions),
    }
  })
}

export function filterVisibleQuestions(
  questions: QuestionnaireQuestion[],
  answersById: Record<number, AnswerValue>,
): QuestionnaireQuestion[] {
  return computeQuestionsWithVisibility(questions, answersById).filter(
    (question) => question.is_visible !== false,
  )
}
