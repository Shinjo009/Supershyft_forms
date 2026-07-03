export type FamilyHistoryQuestionPreview = {
  line1: string
  line2: string
}

export type FamilyHistoryHealthCondition =
  | 'type-2-diabetes'
  | 'hypertension'
  | 'fatty-liver'
  | 'lipid-disorders'
  | 'heart-ailments'
  | 'thyroid-disorders'
  | 'pcos'
  | 'stroke'
  | 'mental-health'
  | 'none'
  | 'other'

export const FAMILY_HISTORY_HEALTH_CONDITIONS: {
  id: FamilyHistoryHealthCondition
  label: string
}[] = [
  { id: 'type-2-diabetes', label: 'Type 2 Diabetes' },
  { id: 'hypertension', label: 'Hypertension' },
  { id: 'fatty-liver', label: 'Fatty Liver' },
  { id: 'lipid-disorders', label: 'Lipid Disorders' },
  { id: 'heart-ailments', label: 'Heart Ailments' },
  { id: 'thyroid-disorders', label: 'Thyroid Disorders' },
  { id: 'pcos', label: 'PCOS' },
  { id: 'stroke', label: 'Stroke' },
  { id: 'mental-health', label: 'Mental Health' },
  { id: 'none', label: 'None' },
  { id: 'other', label: 'Other' },
]

export const FAMILY_HISTORY_MEDICATION_OPTIONS: {
  id: FamilyHistoryHealthCondition
  label: string
}[] = [
  { id: 'type-2-diabetes', label: 'Type 2 Diabetes' },
  { id: 'fatty-liver', label: 'Fatty Liver' },
  { id: 'none', label: 'None' },
  { id: 'other', label: 'Other' },
]

export const FAMILY_HISTORY_TOTAL_QUESTIONS = 4

export function familyHistoryProgressPercent(questionIndex: number): number {
  return Math.round(((questionIndex + 1) / FAMILY_HISTORY_TOTAL_QUESTIONS) * 100)
}

export const FAMILY_HISTORY_NEXT_PREVIEWS: FamilyHistoryQuestionPreview[] = [
  { line1: 'Do any of your close blood ', line2: 'relatives...' },
  { line1: 'Are you diagnosed with ', line2: 'the following diseases?' },
  { line1: 'Are you taking medications ', line2: 'for the following diseases?' },
  { line1: '', line2: '' },
]
