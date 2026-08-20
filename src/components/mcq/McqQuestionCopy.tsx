import { MCQ_QUESTION_HINT_CLASS } from './mcqLayout'

/** Question title plus optional API `sub_text` shown directly underneath. */
export function McqQuestionCopy({
  text,
  subText,
}: {
  text: string
  subText?: string | null
}) {
  const hint = String(subText ?? '').trim()
  return (
    <>
      <p>{text}</p>
      {hint ? <p className={MCQ_QUESTION_HINT_CLASS}>{hint}</p> : null}
    </>
  )
}
