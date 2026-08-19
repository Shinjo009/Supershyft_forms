import type { QuestionnaireQuestion } from '../api/questionnaire'
import type { AnswerValue } from './questionnaireVisibility'

export type CategoryQuestionnaireDraft = {
  questions: QuestionnaireQuestion[]
  answers: Record<number, AnswerValue>
}

const STORAGE_PREFIX = 'supershyft.questionnaireDrafts.v1'

function storageKey(assessmentInstanceId: number): string {
  return `${STORAGE_PREFIX}:${assessmentInstanceId}`
}

function asDraftMap(value: unknown): Record<string, CategoryQuestionnaireDraft> {
  if (!value || typeof value !== 'object') return {}
  return value as Record<string, CategoryQuestionnaireDraft>
}

export function readQuestionnaireDrafts(
  assessmentInstanceId: number,
): Record<string, CategoryQuestionnaireDraft> {
  if (typeof sessionStorage === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(storageKey(assessmentInstanceId))
    if (!raw) return {}
    return asDraftMap(JSON.parse(raw))
  } catch {
    return {}
  }
}

export function upsertQuestionnaireDraft(
  assessmentInstanceId: number,
  keys: Array<string | number>,
  draft: CategoryQuestionnaireDraft,
) {
  if (!assessmentInstanceId || keys.length === 0) return
  const all = readQuestionnaireDrafts(assessmentInstanceId)
  for (const key of keys) {
    const normalized = String(key || '').trim()
    if (!normalized || normalized === '0' || normalized === 'NaN') continue
    all[normalized] = draft
  }
  try {
    sessionStorage.setItem(storageKey(assessmentInstanceId), JSON.stringify(all))
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function findQuestionnaireDraft(
  assessmentInstanceId: number | null,
  memory: Record<string, CategoryQuestionnaireDraft>,
  keys: Array<string | number>,
): CategoryQuestionnaireDraft | undefined {
  const stored = assessmentInstanceId ? readQuestionnaireDrafts(assessmentInstanceId) : {}
  const normalizedKeys = keys
    .map((key) => String(key || '').trim())
    .filter((key) => key && key !== '0' && key !== 'NaN')

  for (const key of normalizedKeys) {
    if (memory[key]?.questions?.length) return memory[key]
  }
  for (const key of normalizedKeys) {
    if (stored[key]?.questions?.length) return stored[key]
  }
  return undefined
}
