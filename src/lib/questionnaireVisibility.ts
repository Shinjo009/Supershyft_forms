import type { QuestionnaireOption, QuestionnaireQuestion } from '../api/questionnaire'
import { getOptionLabel, getOptionValue, isMultiChoiceType } from '../api/questionnaire'

export type VisibilityCondition = {
  type?: string
  operator?: string
  question_key?: string
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

function matchesOperator(actual: unknown, expected: unknown, operator: string): boolean {
  const op = String(operator || 'equals').trim().toLowerCase()

  if (op === 'equals') {
    if (Array.isArray(actual)) {
      return actual.some((item) => normalizeRuleText(item) === normalizeRuleText(expected))
    }
    return normalizeRuleText(actual) === normalizeRuleText(expected)
  }

  if (op === 'not_equals') {
    if (Array.isArray(actual)) {
      // Unanswered multi → treat as not equal only if we want follow-ups hidden until answered.
      // Match single-choice behavior: empty is not equal to "0", so follow-up can show until parent answered.
      // For caffeine_frequency (single), empty !== "0" is true → caffeine_type would show early.
      // Prefer: unanswered parent fails not_equals for show-when-not-X rules? User said:
      // "User not selects I do not drink... Then only we need to display"
      // So we need an answer that is NOT "0". Empty should NOT show the follow-up.
      if (actual.length === 0) return false
      return !actual.some((item) => normalizeRuleText(item) === normalizeRuleText(expected))
    }
    if (isEmptyAnswer(actual)) return false
    return normalizeRuleText(actual) !== normalizeRuleText(expected)
  }

  if (op === 'contains') {
    if (Array.isArray(actual)) {
      return actual.some((item) => normalizeRuleText(item) === normalizeRuleText(expected))
    }
    return (
      normalizeRuleText(expected) !== '' &&
      normalizeRuleText(actual).includes(normalizeRuleText(expected))
    )
  }

  if (op === 'not_contains') {
    if (Array.isArray(actual)) {
      return !actual.some((item) => normalizeRuleText(item) === normalizeRuleText(expected))
    }
    return (
      normalizeRuleText(expected) === '' ||
      !normalizeRuleText(actual).includes(normalizeRuleText(expected))
    )
  }

  if (op === 'in') {
    if (!Array.isArray(expected)) return false
    if (Array.isArray(actual)) {
      return actual.some((item) =>
        expected.some((exp) => normalizeRuleText(item) === normalizeRuleText(exp)),
      )
    }
    return expected.some((item) => normalizeRuleText(actual) === normalizeRuleText(item))
  }

  if (op === 'not_in') {
    if (!Array.isArray(expected)) return false
    if (isEmptyAnswer(actual)) return false
    if (Array.isArray(actual)) {
      return !actual.some((item) =>
        expected.some((exp) => normalizeRuleText(item) === normalizeRuleText(exp)),
      )
    }
    return !expected.some((item) => normalizeRuleText(actual) === normalizeRuleText(item))
  }

  return false
}

export function evaluateVisibilityRules(
  visibilityRules: VisibilityRules | null | undefined,
  answersByQuestionKey: Record<string, unknown>,
): boolean {
  if (!visibilityRules || typeof visibilityRules !== 'object') return true

  const conditions = visibilityRules.conditions
  if (!Array.isArray(conditions) || conditions.length === 0) return true

  const matchMode = String(visibilityRules.match || 'all').trim().toLowerCase()
  const results = conditions.map((condition) => {
    if (!condition || typeof condition !== 'object') return false
    const conditionType = String(condition.type || '').trim().toLowerCase()
    const operator = String(condition.operator || 'equals').trim().toLowerCase()
    const expected = condition.value

    if (conditionType === 'question_answer') {
      const questionKey = String(condition.question_key || '').trim().toLowerCase()
      const actual = answersByQuestionKey[questionKey]
      return matchesOperator(actual, expected, operator)
    }

    return false
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

/**
 * Resolve whether a question should show:
 * - no `visibility_rules` → always show
 * - has `visibility_rules` → evaluate match/conditions against prior answers
 */
export function isQuestionVisible(
  question: QuestionnaireQuestion,
  answersByQuestionKey: Record<string, unknown>,
): boolean {
  const rules = question.visibility_rules
  const hasRules =
    rules &&
    typeof rules === 'object' &&
    Array.isArray((rules as VisibilityRules).conditions) &&
    ((rules as VisibilityRules).conditions?.length || 0) > 0

  if (!hasRules) {
    // No rules → always display (user: show at any cost when unrestricted)
    return true
  }

  return evaluateVisibilityRules(rules as VisibilityRules, answersByQuestionKey)
}

export function buildAnswersByQuestionKey(
  questions: QuestionnaireQuestion[],
  answersById: Record<number, AnswerValue>,
  upToIndexExclusive: number,
): Record<string, unknown> {
  const byKey: Record<string, unknown> = {}

  for (let i = 0; i < upToIndexExclusive; i += 1) {
    const prior = questions[i]
    const key = String(prior?.question_key || '')
      .trim()
      .toLowerCase()
    if (!key) continue

    const fromState = answersById[prior.question_id]
    const raw = !isEmptyAnswer(fromState) ? fromState : readInlineAnswer(prior)
    if (isEmptyAnswer(raw)) continue

    byKey[key] = normalizeAnswerForRules(prior, raw)
  }

  return byKey
}

/** Recompute visibility for every question in API order using live answers. */
export function computeQuestionsWithVisibility(
  questions: QuestionnaireQuestion[],
  answersById: Record<number, AnswerValue>,
): QuestionnaireQuestion[] {
  return questions.map((question, index) => {
    const answersByKey = buildAnswersByQuestionKey(questions, answersById, index)
    return {
      ...question,
      is_visible: isQuestionVisible(question, answersByKey),
    }
  })
}

export function filterVisibleQuestions(
  questions: QuestionnaireQuestion[],
  answersById: Record<number, AnswerValue>,
): QuestionnaireQuestion[] {
  return computeQuestionsWithVisibility(questions, answersById).filter(
    (question) => question.is_visible !== false && question.is_read_only !== true,
  )
}
