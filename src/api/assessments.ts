import { isFrontendOnly } from '../lib/frontendOnly'
import { authorizedGet, authorizedPost } from './http'

export type AssessmentRow = {
  assessment_instance_id?: number
  package_id?: number
  package_code?: string
  package_display_name?: string
  engagement_id?: number
  status?: string
  metsights_record_id?: string
  assigned_at?: string
  completed_at?: string | null
}

export type AssessmentCategoryStatus = {
  id: number
  category_id: number
  category_key: string
  display_name: string
  category_of?: string
  status?: string
}

type AssessmentsMeResponse = {
  data?: AssessmentRow[]
}

type AssessmentStatusResponse = {
  data?: AssessmentCategoryStatus[]
}

const EXCLUDED_CATEGORY_KEYS = new Set(['health_vitals', 'vitals'])

const CATEGORY_UI_ORDER = ['anthro', 'family', 'lifestyle', 'nutrition'] as const

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  anthropometry:
    'Your measurements power our AI to generate accurate metabolic and wellness scores.',
  family_history:
    "Knowing your family's health patterns helps us predict risks more accurately.",
  lifestyle_habits:
    'Your routines help our system decode how your habits influence your health.',
  nutrition_log:
    'Your food patterns help us understand nutrition habits that shape long-term health.',
}

export function categoryDescriptionForKey(categoryKey: string): string | undefined {
  return CATEGORY_DESCRIPTIONS[String(categoryKey || '').trim().toLowerCase()]
}

export function normalizeCategoryKey(categoryKey: string): string {
  return String(categoryKey || '')
    .trim()
    .toLowerCase()
}

export function isAnthropometryCategory(categoryKey: string): boolean {
  return normalizeCategoryKey(categoryKey).includes('anthro')
}

export function sortAssessmentCategoriesForUi(
  categories: AssessmentCategoryStatus[],
): AssessmentCategoryStatus[] {
  return [...categories].sort((a, b) => {
    const rank = (key: string) => {
      const index = CATEGORY_UI_ORDER.findIndex((part) => normalizeCategoryKey(key).includes(part))
      return index === -1 ? 99 : index
    }
    return rank(a.category_key) - rank(b.category_key)
  })
}

export function isCategoryCompleted(
  category: AssessmentCategoryStatus,
  completedCategoryIds: number[],
): boolean {
  if (completedCategoryIds.includes(Number(category.category_id))) return true
  return (
    String(category.status || '')
      .trim()
      .toLowerCase() === 'completed'
  )
}

function toTimestamp(value: unknown): number {
  if (typeof value !== 'string' || !value.trim()) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizePackageCode(row: AssessmentRow): string {
  return String(row.package_code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
}

/** Metsights Pro or Basic only — excludes FitPrint / Fitness Print. */
export function isMetsightsProOrBasic(row: AssessmentRow): boolean {
  const code = normalizePackageCode(row)
  const display = String(row.package_display_name || '')
    .trim()
    .toLowerCase()

  if (isFitprintAssessment(row)) {
    return false
  }

  if (code.includes('METSIGHTS') && (code.includes('PRO') || code.includes('BASIC'))) {
    return true
  }

  if (display.includes('metsights') && (display.includes('pro') || display.includes('basic'))) {
    return true
  }

  return false
}

export function isFitprintAssessment(row: AssessmentRow): boolean {
  const code = normalizePackageCode(row)
  const display = String(row.package_display_name || '')
    .trim()
    .toLowerCase()

  return (
    code === 'MY_FITNESS_PRINT' ||
    code.includes('FITPRINT') ||
    code.includes('FITNESS_PRINT') ||
    display.includes('fitprint') ||
    display.includes('fit print') ||
    display.includes('fitness print')
  )
}

function sortLatestFirst(rows: AssessmentRow[]): AssessmentRow[] {
  return [...rows].sort((a, b) => {
    const byAssigned = toTimestamp(b.assigned_at) - toTimestamp(a.assigned_at)
    if (byAssigned !== 0) return byAssigned
    return (b.assessment_instance_id || 0) - (a.assessment_instance_id || 0)
  })
}

export function pickLatestMetsightsProOrBasicId(rows: AssessmentRow[]): number | null {
  const latest = sortLatestFirst(rows.filter(isMetsightsProOrBasic))[0]
  const id = Number(latest?.assessment_instance_id || 0)
  return Number.isFinite(id) && id > 0 ? id : null
}

export function pickLatestFitprintId(
  rows: AssessmentRow[],
  preferredEngagementId?: number | null,
): number | null {
  const fitprintRows = rows.filter(isFitprintAssessment)
  const preferred = Number(preferredEngagementId || 0)
  const scoped =
    Number.isFinite(preferred) && preferred > 0
      ? fitprintRows.filter((row) => Number(row.engagement_id || 0) === preferred)
      : fitprintRows
  const latest = sortLatestFirst(scoped.length > 0 ? scoped : fitprintRows)[0]
  const id = Number(latest?.assessment_instance_id || 0)
  return Number.isFinite(id) && id > 0 ? id : null
}

export function getAssessmentEngagementId(
  rows: AssessmentRow[],
  assessmentInstanceId: number,
): number | null {
  const match = rows.find(
    (row) => Number(row.assessment_instance_id || 0) === Number(assessmentInstanceId),
  )
  const engagementId = Number(match?.engagement_id || 0)
  return Number.isFinite(engagementId) && engagementId > 0 ? engagementId : null
}

export async function submitAssessmentCategory(
  accessToken: string,
  assessmentInstanceId: number,
  category: 'diet-lifestyle-parameters' | 'fitness-parameters',
): Promise<unknown> {
  const id = Number(assessmentInstanceId)
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Invalid assessment instance id.')
  }

  if (isFrontendOnly()) {
    console.info('[frontend-only] skipped assessment category submit', {
      assessmentInstanceId: id,
      category,
    })
    return null
  }

  return authorizedPost(`/assessments/${id}/submit`, accessToken, { category })
}

/**
 * Finalize diet/lifestyle on Metsights Pro/Basic, and fitness on FitPrint when present.
 */
export async function submitCompletedAssessmentFlow(
  accessToken: string,
  metsightsAssessmentInstanceId: number,
): Promise<{ metsightsSubmitted: boolean; fitprintSubmitted: boolean }> {
  if (isFrontendOnly()) {
    console.info('[frontend-only] skipped completed assessment submit', {
      metsightsAssessmentInstanceId,
    })
    return { metsightsSubmitted: true, fitprintSubmitted: false }
  }

  const rows = await listMyAssessments(accessToken)
  const metsightsId = Number(metsightsAssessmentInstanceId)
  if (!Number.isFinite(metsightsId) || metsightsId <= 0) {
    throw new Error('Missing Metsights assessment instance id.')
  }

  await submitAssessmentCategory(accessToken, metsightsId, 'diet-lifestyle-parameters')

  const engagementId = getAssessmentEngagementId(rows, metsightsId)
  const fitprintId = pickLatestFitprintId(rows, engagementId)
  let fitprintSubmitted = false

  if (fitprintId) {
    await submitAssessmentCategory(accessToken, fitprintId, 'fitness-parameters')
    fitprintSubmitted = true
  }

  return { metsightsSubmitted: true, fitprintSubmitted }
}

export function filterAssessmentCategoriesForUi(
  categories: AssessmentCategoryStatus[],
): AssessmentCategoryStatus[] {
  return sortAssessmentCategoriesForUi(
    categories.filter((category) => {
      const key = String(category.category_key || '')
        .trim()
        .toLowerCase()
      return key.length > 0 && !EXCLUDED_CATEGORY_KEYS.has(key)
    }),
  )
}

export async function listMyAssessments(accessToken: string): Promise<AssessmentRow[]> {
  const response = await authorizedGet<AssessmentsMeResponse>('/assessments/me', accessToken, {
    page: 1,
    limit: 50,
  })
  return Array.isArray(response?.data) ? response.data : []
}

export async function getAssessmentCategoryStatuses(
  accessToken: string,
  assessmentInstanceId: number,
): Promise<AssessmentCategoryStatus[]> {
  const response = await authorizedGet<AssessmentStatusResponse>(
    `/assessments/${assessmentInstanceId}/status`,
    accessToken,
  )
  return Array.isArray(response?.data) ? response.data : []
}

export type AssessmentBootstrapResult = {
  assessmentInstanceId: number
  categories: AssessmentCategoryStatus[]
}

/** Resolve latest Metsights Pro/Basic assessment and questionnaire categories for Step 2. */
export async function loadAssessmentCategoriesForStep2(
  accessToken: string,
): Promise<AssessmentBootstrapResult> {
  if (isFrontendOnly()) {
    console.info('[frontend-only] using local mock assessment categories')
    return {
      assessmentInstanceId: 1,
      categories: [
        {
          id: 1,
          category_id: 1,
          category_key: 'anthropometry',
          display_name: 'Anthropometry',
          status: 'pending',
        },
        {
          id: 2,
          category_id: 2,
          category_key: 'family_history',
          display_name: 'Family History',
          status: 'pending',
        },
        {
          id: 3,
          category_id: 3,
          category_key: 'lifestyle_habits',
          display_name: 'Lifestyle & Habits',
          status: 'pending',
        },
        {
          id: 4,
          category_id: 4,
          category_key: 'nutrition_log',
          display_name: 'Nutrition Log',
          status: 'pending',
        },
      ],
    }
  }

  const rows = await listMyAssessments(accessToken)
  const assessmentInstanceId = pickLatestMetsightsProOrBasicId(rows)

  if (!assessmentInstanceId) {
    throw new Error('No Metsights Pro or Basic assessment found for this account.')
  }

  const allCategories = await getAssessmentCategoryStatuses(accessToken, assessmentInstanceId)
  const categories = filterAssessmentCategoriesForUi(allCategories)

  if (categories.length === 0) {
    throw new Error('No assessment categories available to continue.')
  }

  return { assessmentInstanceId, categories }
}
