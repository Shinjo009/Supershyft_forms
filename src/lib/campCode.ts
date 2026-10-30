const RESERVED_PATH_SEGMENTS = new Set(['assets', 'data', 'favicon.svg', 'icons.svg'])
const CAMP_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/

function currentPathname(): string {
  if (typeof window === 'undefined') return ''
  return window.location.pathname
}

/** First path segment only: `/J1z2vpkmbxrr` or `/J1z2vpkmbxrr/` → `J1z2vpkmbxrr`. */
export function getCampCodeFromPath(pathname = currentPathname()): string {
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
  if (!CAMP_CODE_PATTERN.test(code)) return ''
  return code
}

/** Camp comes from the URL path. Empty when the link has no usable code. */
export function resolveCampCode(): string {
  return getCampCodeFromPath()
}
