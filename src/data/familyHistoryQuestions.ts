export type FamilyHistoryQuestionPreview = {
  line1: string
  line2: string
}

import type { McqInfoItem } from '../components/mcq/mcqInfoTypes'

export type FamilyHistoryInfoItem = McqInfoItem

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
  { id: 'type-2-diabetes', label: 'Type 2 diabetes' },
  { id: 'hypertension', label: 'Hypertension' },
  { id: 'fatty-liver', label: 'Fatty liver' },
  { id: 'lipid-disorders', label: 'Lipid disorders' },
  { id: 'heart-ailments', label: 'Heart ailments' },
  { id: 'thyroid-disorders', label: 'Thyroid disorders' },
  { id: 'pcos', label: 'PCOS' },
  { id: 'stroke', label: 'Stroke' },
  { id: 'mental-health', label: 'Mental health' },
  { id: 'none', label: 'None' },
  { id: 'other', label: 'Other' },
]

export const FAMILY_HISTORY_MEDICATION_OPTIONS: {
  id: FamilyHistoryHealthCondition
  label: string
}[] = [
  { id: 'type-2-diabetes', label: 'Type 2 diabetes' },
  { id: 'fatty-liver', label: 'Fatty liver' },
  { id: 'none', label: 'None' },
  { id: 'other', label: 'Other' },
]

export const FAMILY_HISTORY_TOTAL_QUESTIONS = 4

export function familyHistoryProgressPercent(
  questionIndex: number,
  isCurrentQuestionAnswered = false,
): number {
  const completed = questionIndex + (isCurrentQuestionAnswered ? 1 : 0)
  return Math.round((completed / FAMILY_HISTORY_TOTAL_QUESTIONS) * 100)
}

export const FAMILY_HISTORY_NEXT_PREVIEWS: FamilyHistoryQuestionPreview[] = [
  { line1: 'Do any of your close blood ', line2: 'relatives...' },
  { line1: 'Are you diagnosed with ', line2: 'the following diseases?' },
  { line1: 'Are you taking medications ', line2: 'for the following diseases?' },
  { line1: '', line2: '' },
]

/** Figma 5725:14796 — health condition glossary (Q2–Q4) */
export const FAMILY_HISTORY_HEALTH_INFO_ITEMS: FamilyHistoryInfoItem[] = [
  { term: 'Fatty liver', description: 'Non-alcoholic fatty liver disorder' },
  { term: 'Heart ailments', description: 'Heart disease, heart attack, stroke' },
  { term: 'PCOS', description: 'Polycystic ovary syndrome' },
  {
    term: 'Mental health',
    description: 'Stress, depression, other psychological disorders',
  },
  { term: 'Hypertension', description: 'High blood pressure' },
  { term: 'Lipid disorders', description: 'High cholesterol, triglycerides' },
  { term: 'Thyroid disorders', description: 'Hypothyroidism' },
  {
    term: 'Stroke',
    description: 'Interruption of blood flow to the brain (ischemic or hemorrhagic).',
  },
]

/** Figma — location definitions (Q1) */
export const FAMILY_HISTORY_LOCATION_INFO_ITEMS: FamilyHistoryInfoItem[] = [
  {
    term: 'Coastal',
    description: 'Along or near the Coast',
  },
  {
    term: 'Inland',
    description: 'Away from the Coastline',
  },
]

export const FAMILY_HISTORY_INFO_BY_QUESTION: FamilyHistoryInfoItem[][] = [
  FAMILY_HISTORY_LOCATION_INFO_ITEMS,
  FAMILY_HISTORY_HEALTH_INFO_ITEMS,
  FAMILY_HISTORY_HEALTH_INFO_ITEMS,
  FAMILY_HISTORY_HEALTH_INFO_ITEMS,
]
