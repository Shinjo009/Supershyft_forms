import type { McqInfoItem } from '../components/mcq/mcqInfoTypes'

/**
 * Glossary-style help_text (e.g. "Whole Grains : Wheat, rice. Pulses : Beans.")
 * belongs in the (i) overlay, not as grey text under the question.
 */
export function isGlossaryHelpText(helpText: string | null | undefined): boolean {
  const text = helpText?.trim()
  if (!text) return false
  return /[A-Za-z][^:]{0,60}?\s*:\s*\S/.test(text)
}

/**
 * Turns API `help_text` glossary strings into info-card items.
 * Expected shape: "Term : description. Next term : description."
 */
export function parseHelpTextToInfoItems(helpText: string | null | undefined): McqInfoItem[] {
  const text = helpText?.trim()
  if (!text) return []

  const pattern = /(?:^|[.]\s+)([A-Za-z][^:]{0,60}?)\s*:\s*/g
  const matches = [...text.matchAll(pattern)]

  if (matches.length === 0) {
    return [{ term: 'Info', description: text }]
  }

  const items: McqInfoItem[] = []
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const term = match[1]?.trim()
    if (!term) continue

    const start = (match.index ?? 0) + match[0].length
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length
    const description = text
      .slice(start, end)
      .trim()
      .replace(/[.\s]+$/, '')
      .trim()

    if (description) {
      items.push({ term, description })
    }
  }

  return items.length > 0 ? items : [{ term: 'Info', description: text }]
}
