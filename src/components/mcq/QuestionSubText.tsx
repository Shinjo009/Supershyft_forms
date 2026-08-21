import { MCQ_QUESTION_SUBTEXT_CLASS } from './mcqLayout'

/** API `sub_text` rendered just below the question title. */
export function QuestionSubText({ text }: { text?: string | null }) {
  const value = String(text || '').trim()
  if (!value) return null
  return <p className={MCQ_QUESTION_SUBTEXT_CLASS}>{value}</p>
}
