/**
 * Maps technical / network / API errors to short client-friendly copy.
 * Validation messages already written for users are left unchanged.
 */

const FRIENDLY_DEFAULT = 'Please try again.'

function normalize(message: string): string {
  return message.trim().replace(/\s+/g, ' ')
}

export function toUserFacingError(raw: unknown, fallback = FRIENDLY_DEFAULT): string {
  const message =
    raw instanceof Error
      ? raw.message
      : typeof raw === 'string'
        ? raw
        : fallback

  const text = normalize(message || '')
  if (!text) return fallback

  const lower = text.toLowerCase()

  if (
    lower === 'load failed' ||
    lower === 'failed to fetch' ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('net::err_') ||
    lower.includes('err_internet_disconnected') ||
    lower.includes('err_connection') ||
    lower.includes('err_name_not_resolved') ||
    lower.includes('err_timed_out') ||
    lower.includes('timeout') ||
    lower.includes('aborted') ||
    lower.includes('cors')
  ) {
    return 'Please check your internet and try again.'
  }

  if (lower.includes('method not allowed') || lower.includes('405')) {
    return 'Something went wrong. Please try again.'
  }

  if (lower.includes('internal_error') || lower.includes('internal server error')) {
    return 'Please try again.'
  }

  if (lower.includes('missing api base url') || lower.includes('vite_backend_base_url')) {
    return 'Service is temporarily unavailable. Please try again later.'
  }

  if (
    lower.includes('you are not logged in') ||
    lower.includes('unauthorized') ||
    /\b401\b/.test(lower)
  ) {
    return 'Your session expired. Please go back and continue again.'
  }

  if (lower.includes('forbidden') || /\b403\b/.test(lower)) {
    return "You don't have access to continue. Please try again later."
  }

  const statusMatch = text.match(/Request failed \((\d{3})\)/i)
  if (statusMatch) {
    const status = Number.parseInt(statusMatch[1], 10)
    if (status === 400 || status === 422) {
      return 'Some details look invalid. Please check and try again.'
    }
    if (status === 401) return 'Your session expired. Please go back and continue again.'
    if (status === 403) return "You don't have access to continue. Please try again later."
    if (status === 404) return 'Service unavailable. Please try again later.'
    if (status === 409) return 'This is already registered. Please continue or use different details.'
    if (status === 429) return 'Please wait and try again.'
    if (status >= 500) return 'Server is busy. Please try again in a moment.'
    return FRIENDLY_DEFAULT
  }

  if (/\b404\b/.test(lower) && lower.includes('not found')) {
    return 'Service unavailable. Please try again later.'
  }

  if (/\b409\b/.test(lower) || lower.includes('already exists') || lower.includes('already enrolled')) {
    return 'This is already registered. Please continue or use different details.'
  }

  if (/\b50[0-9]\b/.test(lower)) {
    return 'Server is busy. Please try again in a moment.'
  }

  // Keep short, already human messages (validation / product copy)
  if (
    text.length <= 160 &&
    !lower.includes('request failed') &&
    !lower.includes('error_code') &&
    !lower.includes('[url:') &&
    !lower.includes('[engagement:') &&
    !lower.includes('stack') &&
    !lower.startsWith('{') &&
    !lower.startsWith('[')
  ) {
    return text
  }

  return fallback
}
