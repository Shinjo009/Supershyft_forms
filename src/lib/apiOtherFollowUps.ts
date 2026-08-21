import {
  getOptionLabel,
  getOptionValue,
  isMultiChoiceType,
  isSingleChoiceType,
  type QuestionnaireOption,
  type QuestionnaireQuestion,
} from '../api/questionnaire'
import {
  computeQuestionsWithVisibility,
  visibilityRulesForQuestion,
  type AnswerValue,
} from './questionnaireVisibility'

export const OTHER_SPECIFY_MAX_LENGTH = 45

function normalizeKey(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

/** Option values/labels that mean "Other" on an MCQ. */
export function isOtherOption(option: QuestionnaireOption): boolean {
  const value = normalizeKey(getOptionValue(option))
  const label = normalizeKey(getOptionLabel(option))
  return (
    value === 'other' ||
    label === 'other' ||
    value === 'others' ||
    label === 'others' ||
    value.endsWith('_other') ||
    label.endsWith(' (other)')
  )
}

export function questionHasOtherOption(question: QuestionnaireQuestion): boolean {
  const options = Array.isArray(question.options) ? question.options : []
  return options.some(isOtherOption)
}

/** True when the current selection still includes the MCQ's Other option. */
export function selectedIncludesOther(
  selectedValues: string[],
  options: QuestionnaireOption[] = [],
): boolean {
  if (selectedValues.length === 0) return false

  if (options.length > 0) {
    return selectedValues.some((selected) => {
      const matched = options.find((option) => {
        const value = getOptionValue(option)
        const label = getOptionLabel(option)
        return value === selected || label === selected
      })
      return matched ? isOtherOption(matched) : normalizeKey(selected) === 'other'
    })
  }

  return selectedValues.some((value) => {
    const normalized = normalizeKey(value)
    return normalized === 'other' || normalized === 'others' || normalized.endsWith('_other')
  })
}

function isChoiceQuestion(question: QuestionnaireQuestion): boolean {
  const type = String(question.question_type || '')
  return (
    isMultiChoiceType(type) ||
    isSingleChoiceType(type) ||
    (Array.isArray(question.options) && (question.options?.length || 0) > 0)
  )
}

function looksLikeOtherTextQuestion(question: QuestionnaireQuestion): boolean {
  const key = normalizeKey(question.question_key)
  const text = normalizeKey(question.question_text)
  const looksOther =
    key === 'other' ||
    key === 'others' ||
    key.endsWith('_other') ||
    key.endsWith('.other') ||
    key.includes('_other_') ||
    key.includes('specify') ||
    text === 'other' ||
    text === 'others' ||
    text.endsWith(' other') ||
    text.includes('(other)') ||
    text.includes('please specify') ||
    (text.includes('specify') && text.includes('other')) ||
    /\(\s*other\s*\)/i.test(question.question_text || '')
  if (!looksOther) return false
  if (isChoiceQuestion(question) && questionHasOtherOption(question) && !key.endsWith('_other')) {
    return false
  }
  return true
}

/** `relative_conditions_other` → `relative_conditions` */
function inferredParentKey(followUp: QuestionnaireQuestion): string {
  const key = normalizeKey(followUp.question_key)
  if (key.endsWith('_other')) return key.slice(0, -'_other'.length)
  if (key.endsWith('.other')) return key.slice(0, -'.other'.length)
  return ''
}

function conditionValueMatchesParentOther(
  expected: string,
  parent: QuestionnaireQuestion,
): boolean {
  if (!expected) return false
  if (expected === 'other' || expected === 'others' || expected.includes('other')) return true

  const options = Array.isArray(parent.options) ? parent.options : []
  return options.some((option) => {
    if (!isOtherOption(option)) return false
    return (
      expected === normalizeKey(getOptionValue(option)) ||
      expected === normalizeKey(getOptionLabel(option)) ||
      expected === normalizeKey(option.option_id)
    )
  })
}

function visibilityPointsToParentOther(
  followUp: QuestionnaireQuestion,
  parent: QuestionnaireQuestion,
): boolean {
  const parentKey = normalizeKey(parent.question_key)
  if (!parentKey) return false

  const parsed = visibilityRulesForQuestion(followUp)
  const conditions = parsed?.conditions
  if (!Array.isArray(conditions) || conditions.length === 0) return false

  return conditions.some((condition) => {
    const type = normalizeKey(condition.type)
    if (type && type !== 'question_answer' && type !== 'question' && type !== 'answer') {
      if (!normalizeKey(condition.question_key || condition.source_question_key)) return false
    }
    const conditionKey = normalizeKey(condition.question_key || condition.source_question_key)
    if (conditionKey !== parentKey) return false

    const expected = normalizeKey(condition.value)
    return conditionValueMatchesParentOther(expected, parent)
  })
}

function keySuggestsParentOther(
  followUp: QuestionnaireQuestion,
  parent: QuestionnaireQuestion,
): boolean {
  const parentKey = normalizeKey(parent.question_key)
  const followKey = normalizeKey(followUp.question_key)
  if (!parentKey || !followKey) return false
  return (
    followKey === `${parentKey}_other` ||
    followKey === `${parentKey}.other` ||
    followKey.startsWith(`${parentKey}_other`)
  )
}

/**
 * Find the free-text "(other)" question that belongs to a parent MCQ.
 * Prefer visibility_rules / question_key, then nearest later text titled "(other)".
 */
export function findOtherFollowUpForParent(
  parent: QuestionnaireQuestion,
  allQuestions: QuestionnaireQuestion[],
): QuestionnaireQuestion | null {
  const parentIndex = allQuestions.findIndex((q) => q.question_id === parent.question_id)
  if (parentIndex < 0) return null

  const parentKey = normalizeKey(parent.question_key)
  const byInferredKey = parentKey
    ? allQuestions.find(
        (candidate) =>
          candidate.question_id !== parent.question_id &&
          inferredParentKey(candidate) === parentKey,
      )
    : undefined
  if (byInferredKey) return byInferredKey

  const byRulesOrKey = allQuestions.find(
    (candidate) =>
      candidate.question_id !== parent.question_id &&
      looksLikeOtherTextQuestion(candidate) &&
      (visibilityPointsToParentOther(candidate, parent) ||
        keySuggestsParentOther(candidate, parent)),
  )
  if (byRulesOrKey) return byRulesOrKey

  if (!questionHasOtherOption(parent)) return null

  for (let i = parentIndex + 1; i < allQuestions.length; i += 1) {
    const candidate = allQuestions[i]
    if (
      isChoiceQuestion(candidate) &&
      questionHasOtherOption(candidate) &&
      !looksLikeOtherTextQuestion(candidate)
    ) {
      break
    }
    if (looksLikeOtherTextQuestion(candidate)) return candidate
  }

  return null
}

/** Parent MCQ for a standalone "(other)" text question, if any. */
export function findParentForOtherFollowUp(
  followUp: QuestionnaireQuestion,
  allQuestions: QuestionnaireQuestion[],
): QuestionnaireQuestion | null {
  if (questionHasOtherOption(followUp) && !looksLikeOtherTextQuestion(followUp)) return null

  const inferredKey = inferredParentKey(followUp)
  if (inferredKey) {
    const byInferredKey = allQuestions.find(
      (parent) =>
        parent.question_id !== followUp.question_id &&
        normalizeKey(parent.question_key) === inferredKey,
    )
    if (byInferredKey) return byInferredKey
  }

  for (const parent of allQuestions) {
    if (parent.question_id === followUp.question_id) continue
    if (
      visibilityPointsToParentOther(followUp, parent) ||
      keySuggestsParentOther(followUp, parent)
    ) {
      return parent
    }
  }

  if (!looksLikeOtherTextQuestion(followUp)) return null

  const followIndex = allQuestions.findIndex((q) => q.question_id === followUp.question_id)
  if (followIndex <= 0) return null

  for (let i = followIndex - 1; i >= 0; i -= 1) {
    const parent = allQuestions[i]
    if (looksLikeOtherTextQuestion(parent)) continue
    if (isChoiceQuestion(parent)) return parent
  }

  return null
}

/** Hide these from one-question-at-a-time navigation; they render inline on the parent MCQ. */
export function isInlinedOtherTextQuestion(
  question: QuestionnaireQuestion,
  allQuestions: QuestionnaireQuestion[],
): boolean {
  return findParentForOtherFollowUp(question, allQuestions) != null
}

export function filterOutInlinedOtherQuestions(
  questions: QuestionnaireQuestion[],
  allQuestions: QuestionnaireQuestion[],
): QuestionnaireQuestion[] {
  return questions.filter((question) => !isInlinedOtherTextQuestion(question, allQuestions))
}

/**
 * One-at-a-time steps: drop standalone "(other)" specify questions so they
 * render inline on the parent. Never revive a parent that visibility hid.
 */
export function buildNavigableQuestionnaireQuestions(
  questions: QuestionnaireQuestion[],
  answersById: Record<number, AnswerValue>,
): QuestionnaireQuestion[] {
  const withVisibility = computeQuestionsWithVisibility(questions, answersById)
  const visibleIds = new Set(
    withVisibility
      .filter((question) => question.is_visible !== false)
      .map((question) => question.question_id),
  )

  for (const item of questions) {
    const parent = findParentForOtherFollowUp(item, questions)
    if (!parent) continue
    if (!visibleIds.has(parent.question_id)) {
      visibleIds.delete(item.question_id)
    }
  }

  const withParents = questions.filter((question) => visibleIds.has(question.question_id))
  return filterOutInlinedOtherQuestions(withParents, questions)
}
