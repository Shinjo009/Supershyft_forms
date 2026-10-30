import { isFrontendOnly } from '../lib/frontendOnly'
import { publicGet } from './http'

export type CampEngagement = {
  code: string
  city: string
}

export type OnboardingFieldConfig = {
  inputType: 'text' | 'number' | 'json'
  required: boolean
  subPayload: Record<string, unknown>
}

export type CampOnboarding = {
  campCode: string
  organizationName: string
  engagements: CampEngagement[]
  fields: Record<string, OnboardingFieldConfig>
}

const FIELD_ORDER = [
  'first_name',
  'last_name',
  'phone',
  'email',
  'age',
  'gender',
  'participants_employee_id',
  'participant_department',
  'participant_blood_group',
  'address',
  'pincode',
  'city',
  'state',
  'country',
  'referred_by',
  'want_doctor_consultation',
  'want_nutritionist_consultation',
  'consultations',
] as const

const SAMPLE_ONBOARDING: CampOnboarding = {
  campCode: 'J1z2vpkmbxrr',
  organizationName: 'Supershyft',
  engagements: [
    { code: 'ABBL0826', city: 'Bengaluru' },
    { code: 'RVKS0826', city: 'Mumbai' },
  ],
  fields: {
    first_name: { inputType: 'text', required: true, subPayload: {} },
    last_name: { inputType: 'text', required: true, subPayload: {} },
    email: { inputType: 'text', required: true, subPayload: {} },
    phone: { inputType: 'text', required: true, subPayload: {} },
    gender: { inputType: 'text', required: true, subPayload: {} },
    address: { inputType: 'text', required: true, subPayload: {} },
    pincode: { inputType: 'text', required: true, subPayload: {} },
    city: { inputType: 'text', required: true, subPayload: {} },
    state: { inputType: 'text', required: true, subPayload: {} },
    country: { inputType: 'text', required: true, subPayload: {} },
    referred_by: { inputType: 'text', required: false, subPayload: {} },
    participants_employee_id: { inputType: 'text', required: true, subPayload: {} },
    participant_department: { inputType: 'text', required: true, subPayload: {} },
    age: { inputType: 'number', required: true, subPayload: {} },
    participant_blood_group: { inputType: 'text', required: true, subPayload: {} },
    consultations: {
      inputType: 'json',
      required: false,
      subPayload: { doctor: true, nutritionist: true, eye: false },
    },
  },
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function unwrapData(value: unknown): Record<string, unknown> {
  const root = asRecord(value)
  if (!root) return {}
  return asRecord(root.data) ?? root
}

function parseInputType(value: unknown): OnboardingFieldConfig['inputType'] {
  const token = readString(value).toLowerCase()
  if (token === 'number' || token === 'json') return token
  return 'text'
}

function parseFields(value: unknown): Record<string, OnboardingFieldConfig> {
  const row = asRecord(value)
  if (!row) return {}
  const fields: Record<string, OnboardingFieldConfig> = {}
  for (const [key, config] of Object.entries(row)) {
    const entry = asRecord(config)
    if (!entry) continue
    const name = key.trim()
    if (!name) continue
    fields[name] = {
      inputType: parseInputType(entry.input_type),
      required: entry.required === true,
      subPayload: asRecord(entry.sub_payload) ?? {},
    }
  }
  return fields
}

function parseEngagements(value: unknown): CampEngagement[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const rows: CampEngagement[] = []
  for (const item of value) {
    const row = asRecord(item)
    if (!row) continue
    const code = readString(row.code) || readString(row.engagement_code)
    const city = readString(row.city)
    if (!code || !city) continue
    const dedupe = `${city.toLowerCase()}::${code.toLowerCase()}`
    if (seen.has(dedupe)) continue
    seen.add(dedupe)
    rows.push({ code, city })
  }
  return rows
}

export function hasOnboardingField(
  fields: Record<string, OnboardingFieldConfig>,
  key: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(fields, key)
}

export function isOnboardingFieldRequired(
  fields: Record<string, OnboardingFieldConfig>,
  key: string,
): boolean {
  return fields[key]?.required === true
}

/** Only required payload fields are collected on the form. */
export function isOnboardingFieldVisible(
  fields: Record<string, OnboardingFieldConfig>,
  key: string,
): boolean {
  return isOnboardingFieldRequired(fields, key)
}

export const ADDRESS_FIELD_KEYS = ['address', 'pincode', 'state', 'country'] as const

export function showAddressSection(fields: Record<string, OnboardingFieldConfig>): boolean {
  return isOnboardingFieldVisible(fields, 'address')
}

export function isAddressPayloadField(key: string): boolean {
  return (ADDRESS_FIELD_KEYS as readonly string[]).includes(key)
}

export type BookingPage = 'personal' | 'address' | 'schedule' | 'preview' | 'otp'

export const BOOKING_PAGE_LABELS: Record<BookingPage, string> = {
  personal: 'Personal',
  address: 'Address',
  schedule: 'Schedule',
  preview: 'Preview',
  otp: 'OTP',
}

export function getBookingPages(includeAddress: boolean): BookingPage[] {
  return includeAddress
    ? ['personal', 'address', 'schedule', 'preview']
    : ['personal', 'schedule', 'preview']
}

export type ConsultationKind = 'doctor' | 'nutritionist' | 'eye'

export type ConsultationOffer = {
  key: ConsultationKind
  label: string
}

const CONSULTATION_ORDER: ConsultationKind[] = ['doctor', 'nutritionist', 'eye']
const CONSULTATION_LABELS: Record<ConsultationKind, string> = {
  doctor: 'Doctor consultation',
  nutritionist: 'Nutritionist consultation',
  eye: 'Eye consultation',
}

function subPayloadEnabled(value: unknown): boolean {
  return value === true || value === 1 || value === 'true'
}

/** Doctor / nutritionist (and eye) come from consultations.sub_payload flags. */
export function getConsultationOffers(
  fields: Record<string, OnboardingFieldConfig>,
): ConsultationOffer[] {
  const json = fields.consultations
  if (json) {
    return CONSULTATION_ORDER.filter((key) => subPayloadEnabled(json.subPayload[key])).map((key) => ({
      key,
      label: CONSULTATION_LABELS[key],
    }))
  }

  const offers: ConsultationOffer[] = []
  if (isOnboardingFieldVisible(fields, 'want_doctor_consultation')) {
    offers.push({ key: 'doctor', label: CONSULTATION_LABELS.doctor })
  }
  if (isOnboardingFieldVisible(fields, 'want_nutritionist_consultation')) {
    offers.push({ key: 'nutritionist', label: CONSULTATION_LABELS.nutritionist })
  }
  return offers
}

export function areConsultationsRequired(fields: Record<string, OnboardingFieldConfig>): boolean {
  if (fields.consultations) return fields.consultations.required === true
  return (
    isOnboardingFieldVisible(fields, 'want_doctor_consultation') ||
    isOnboardingFieldVisible(fields, 'want_nutritionist_consultation')
  )
}

export function orderedOnboardingKeys(
  fields: Record<string, OnboardingFieldConfig>,
): string[] {
  const known = FIELD_ORDER.filter((key) => hasOnboardingField(fields, key))
  const extras = Object.keys(fields).filter((key) => !known.includes(key as (typeof FIELD_ORDER)[number]))
  return [...known, ...extras]
}

export function campCitiesFromEngagements(engagements: CampEngagement[]): string[] {
  const cities: string[] = []
  for (const row of engagements) {
    if (!cities.some((city) => city.toLowerCase() === row.city.toLowerCase())) {
      cities.push(row.city)
    }
  }
  return cities
}

export function engagementForCity(
  engagements: CampEngagement[],
  city: string,
): CampEngagement | null {
  const needle = city.trim().toLowerCase()
  if (!needle) return engagements.length === 1 ? engagements[0] : null
  return engagements.find((row) => row.city.toLowerCase() === needle) ?? null
}

export function shouldShowCampCityDropdown(engagements: CampEngagement[]): boolean {
  return campCitiesFromEngagements(engagements).length > 1
}

export function parseCampOnboarding(payload: unknown, campCode: string): CampOnboarding {
  const data = unwrapData(payload)
  return {
    campCode: readString(data.camp_code) || campCode,
    organizationName:
      readString(data.organization_name) ||
      readString(data.company_name) ||
      readString(data.organisation_name),
    engagements: parseEngagements(data.engagements),
    fields: parseFields(data.onboarding_payload),
  }
}

export async function loadCampOnboarding(campCode: string): Promise<CampOnboarding> {
  if (isFrontendOnly()) {
    return {
      ...SAMPLE_ONBOARDING,
      campCode,
    }
  }

  const payload = await publicGet(`/engagements/camps/code/${encodeURIComponent(campCode)}/onboarding`)
  const parsed = parseCampOnboarding(payload, campCode)
  if (parsed.engagements.length === 0) {
    throw new Error('This camp has no cities available yet.')
  }
  return parsed
}
