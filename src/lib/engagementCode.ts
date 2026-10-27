const RESERVED_PATH_SEGMENTS = new Set(['assets', 'data', 'favicon.svg', 'icons.svg'])
const ENGAGEMENT_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/

function currentPathname(): string {
  if (typeof window === 'undefined') return ''
  return window.location.pathname
}

/** First path segment only: `/SUMU0226` or `/SUMU0226/` → `SUMU0226`. */
export function getEngagementCodeFromPath(pathname = currentPathname()): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length !== 1) return ''

  let raw = segments[0]
  try {
    raw = decodeURIComponent(raw)
  } catch {
    return ''
  }

  const code = raw.trim()
  if (!code) return ''
  if (RESERVED_PATH_SEGMENTS.has(code.toLowerCase())) return ''
  if (code.toUpperCase() === 'XXXXXXXX') return ''
  if (!ENGAGEMENT_CODE_PATTERN.test(code)) return ''
  return code
}

/** Engagement comes from the URL path. Empty when the link has no usable code. */
export function resolveEngagementCode(): string {
  return getEngagementCodeFromPath()
}
