import { getBackendBaseUrl, getCelebalEngagementCodeForGender } from './onboard'

export type LockSlotPayload = {
  address_line: string
  landmark: string
  city: string
  pincode: string
  user_id: number
  blood_collection_date: string
  blood_collection_time_slot_id: string
  blood_collection_time_slot: string
}

export type LockSlotResult = {
  engagementCode: string
  status: string
  message: string
  slotId?: string
  freezeTime?: string
  vendorBillingUserId?: string
  zoneId?: string
}

type LockSlotResponse = {
  data?: {
    engagement_code?: string
    status?: string
    message?: string
    slot_id?: string | number
    freeze_time?: string | number
    vendor_billing_user_id?: string | number
    zone_id?: string | number
  }
  meta?: Record<string, unknown>
  error_code?: string
  message?: string
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export async function lockBookingSlot(
  gender: string,
  payload: LockSlotPayload,
): Promise<LockSlotResult> {
  const baseUrl = getBackendBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Copy .env.example to .env, set VITE_BACKEND_BASE_URL, and restart the dev server.',
    )
  }

  const engagementCode = getCelebalEngagementCodeForGender(gender)
  const url = `${trimTrailingSlash(baseUrl)}/book/code/${encodeURIComponent(engagementCode)}/lock`

  console.info('[lock] request', { engagementCode, url, payload })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data: unknown = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    console.error('[lock] error response', data)
    if (data && typeof data === 'object') {
      const row = data as LockSlotResponse
      if (row.data?.message) throw new Error(row.data.message)
      if (row.message) throw new Error(row.message)
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`Unable to lock slot (${response.status}): ${jsonText}`)
      }
    }
    if (typeof data === 'string' && data.trim()) {
      throw new Error(`Unable to lock slot (${response.status}): ${data}`)
    }
    throw new Error(`Unable to lock slot (${response.status}). Please try again.`)
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid lock response from server.')
  }

  const row = (data as LockSlotResponse).data
  const status = (row?.status || '').trim().toLowerCase()
  const message = (row?.message || '').trim() || 'Slot locked'

  if (status && status !== 'success') {
    throw new Error(message || 'Unable to lock this time slot.')
  }

  return {
    engagementCode: row?.engagement_code?.trim() || engagementCode,
    status: row?.status?.trim() || 'success',
    message,
    slotId: row?.slot_id != null ? String(row.slot_id) : undefined,
    freezeTime: row?.freeze_time != null ? String(row.freeze_time) : undefined,
    vendorBillingUserId:
      row?.vendor_billing_user_id != null ? String(row.vendor_billing_user_id) : undefined,
    zoneId: row?.zone_id != null ? String(row.zone_id) : undefined,
  }
}
