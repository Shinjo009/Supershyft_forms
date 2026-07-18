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
