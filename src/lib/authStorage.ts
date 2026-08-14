const ACCESS_TOKEN_STORAGE_KEY = 'access_token'
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token'

export function getAccessToken(): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)?.trim() || ''
}

export function getRefreshToken(): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)?.trim() || ''
}

export function saveAuthTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return
  if (accessToken) window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken)
  if (refreshToken) window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken)
}

export type AuthTokenPair = {
  accessToken: string
  refreshToken: string
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readPairFromRecord(row: Record<string, unknown>): AuthTokenPair | null {
  const nested =
    row.tokens && typeof row.tokens === 'object' && !Array.isArray(row.tokens)
      ? (row.tokens as Record<string, unknown>)
      : row.token && typeof row.token === 'object' && !Array.isArray(row.token)
        ? (row.token as Record<string, unknown>)
        : row

  const accessToken = readString(nested.access_token || nested.accessToken)
  const refreshToken = readString(nested.refresh_token || nested.refreshToken)
  if (!accessToken) return null
  return { accessToken, refreshToken }
}

/** Pull access/refresh tokens out of the usual SuperShyft `{ data: { tokens } }` envelopes. */
export function extractAuthTokens(data: unknown): AuthTokenPair | null {
  if (!data || typeof data !== 'object') return null
  const row = data as Record<string, unknown>
  const direct = readPairFromRecord(row)
  if (direct) return direct
  if (row.data && typeof row.data === 'object') return readPairFromRecord(row.data as Record<string, unknown>)
  return null
}

/** Save tokens when the API returns them; keep the existing refresh token if only access rotates. */
export function applyAuthTokensFromResponse(data: unknown): AuthTokenPair | null {
  const extracted = extractAuthTokens(data)
  if (!extracted) return null
  const refreshToken = extracted.refreshToken || getRefreshToken()
  if (!refreshToken) return extracted
  saveAuthTokens(extracted.accessToken, refreshToken)
  return { accessToken: extracted.accessToken, refreshToken }
}
