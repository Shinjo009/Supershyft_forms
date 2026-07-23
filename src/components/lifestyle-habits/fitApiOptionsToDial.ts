import {
  getOptionLabel,
  getOptionValue,
  type QuestionnaireOption,
} from '../../api/questionnaire'
import type {
  RadialDialArcLayout,
  RadialDialConfig,
  RadialDialPillConfig,
} from './radialDialShared'

export type ApiDialOption = {
  value: string
  label: string
}

export type FittedDialResult = {
  config: RadialDialConfig<string>
  centerLabels: Record<string, string>
  /** API options that could not fit into designed slots (rare). */
  overflow: ApiDialOption[]
}

export type SlotDisplayLabels = {
  pill: string
  center: string
  labelLines?: string[]
}

/** Collect unique API options in backend order. */
export function collectApiDialOptions(options: QuestionnaireOption[]): ApiDialOption[] {
  const items: ApiDialOption[] = []
  const seen = new Set<string>()

  for (const option of options) {
    const value = getOptionValue(option)
    const label = getOptionLabel(option) || value
    if (!value && !label) continue
    const key = value || label
    if (seen.has(key)) continue
    seen.add(key)
    items.push({ value: value || label, label })
  }

  return items
}

/**
 * Compress long API labels into dial-safe short text that fits Figma geometry.
 * Prefer designed labels from slot templates when available.
 */
export function abbreviateDialLabel(label: string): { pill: string; center: string; labelLines?: string[] } {
  const text = label.replace(/\s+/g, ' ').trim()
  const lower = text.toLowerCase()

  if (lower.includes('rarely') || (lower.includes('never') && !lower.includes('hour'))) {
    return { pill: 'Rare', center: 'Rare' }
  }

  // "Less than 30 minutes a day" / "Less than 1-hour" → "< 30 m" / "< 1 h"
  let match = lower.match(/less than\s+([\d.]+)\s*-?\s*(minutes?|mins?|hours?|hrs?|h)\b/i)
  if (match) {
    const unit = abbreviateUnit(match[2])
    const pill = unit.startsWith('h') ? `< ${match[1]} h` : `< ${match[1]} m`
    return { pill, center: pill }
  }
  match = lower.match(/<\s*([\d.]+)\s*-?\s*(minutes?|mins?|hours?|hrs?|h)\b/i)
  if (match) {
    const unit = abbreviateUnit(match[2])
    const pill = unit.startsWith('h') ? `< ${match[1]} h` : `< ${match[1]} m`
    return { pill, center: pill }
  }

  // "More than 60 minutes a day" / "More than 4 hours" → "60+ m" / "4h+"
  match = lower.match(/more than\s+([\d.]+)\s*-?\s*(minutes?|mins?|hours?|hrs?|h)\b/i)
  if (match) {
    const unit = abbreviateUnit(match[2])
    const pill = unit.startsWith('h') ? `${match[1]}h+` : `${match[1]}+ m`
    return { pill, center: pill }
  }

  // "Between 15-30 mins" / "1 to 3 hours" / "30-60 minutes"
  match = lower.match(
    /(?:between\s+)?([\d.]+)\s*(?:-|–|to)\s*([\d.]+)\s*-?\s*(minutes?|mins?|hours?|hrs?|h)?/i,
  )
  if (match) {
    const unit = abbreviateUnit(match[3] || inferRangeUnit(match[1], match[2]))
    const pill = unit.startsWith('h')
      ? `${match[1]}-${match[2]} h`
      : `${match[1]}-${match[2]} m`
    return { pill, center: pill }
  }

  // "1-4 hours"
  match = lower.match(/^([\d.]+)\s*-\s*([\d.]+)\s*-?\s*(minutes?|mins?|hours?|hrs?|h)\b/i)
  if (match) {
    const unit = abbreviateUnit(match[3])
    const pill = unit.startsWith('h') ? `${match[1]}-${match[2]} h` : `${match[1]}-${match[2]} m`
    return { pill, center: pill }
  }

  if (text.length <= 10) {
    return { pill: text, center: text }
  }

  // Fallback: up to 2 short lines, hub gets first ~9 chars
  const words = text.split(' ')
  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2)
    const line1 = words.slice(0, mid).join(' ')
    const line2 = words.slice(mid).join(' ')
    return {
      pill: text.length > 22 ? `${line1}` : text,
      labelLines: [trimWords(line1, 12), trimWords(line2, 12)],
      center: trimWords(text, 9),
    }
  }

  return { pill: trimWords(text, 12), center: trimWords(text, 9) }
}

function abbreviateUnit(unit: string): string {
  const u = (unit || '').toLowerCase()
  if (u.startsWith('h')) return 'h'
  if (u.startsWith('min')) return 'm'
  return u || 'm'
}

function inferRangeUnit(a: string, b: string): string {
  const hi = Number(b)
  const lo = Number(a)
  // Sleep/leisure hour ranges are typically ≤ 24; walking minutes often ≥ 15.
  if (Number.isFinite(hi) && hi <= 12 && Number.isFinite(lo) && lo <= 12) return 'h'
  if (Number.isFinite(hi) && hi > 24) return 'm'
  return 'h'
}

function trimWords(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return `${text.slice(0, Math.max(1, maxLen - 1)).trimEnd()}…`
}

function optionText(option: ApiDialOption): string {
  return `${option.value} ${option.label}`.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Assign API options into designed slots:
 * 1) preferred matchers claim a slot
 * 2) remaining options fill empty slots in slotOrder
 * 3) leftover options become overflow
 */
export function assignOptionsToSlots(
  options: ApiDialOption[],
  slotOrder: string[],
  preferredMatchers: Array<{ slot: string; match: (text: string) => boolean }>,
): { bySlot: Map<string, ApiDialOption>; overflow: ApiDialOption[] } {
  const remaining = [...options]
  const bySlot = new Map<string, ApiDialOption>()

  for (const { slot, match } of preferredMatchers) {
    if (!slotOrder.includes(slot) || bySlot.has(slot)) continue
    const index = remaining.findIndex((option) => match(optionText(option)))
    if (index < 0) continue
    bySlot.set(slot, remaining.splice(index, 1)[0])
  }

  for (const slot of slotOrder) {
    if (bySlot.has(slot) || remaining.length === 0) continue
    bySlot.set(slot, remaining.shift()!)
  }

  return { bySlot, overflow: remaining }
}

type RotatedDialTemplate = {
  idPrefix: string
  width: number
  height: number
  dialOffsetX: number
  dialOffsetY: number
  dialSize: number
  hubRadius: number
  baseArc: RadialDialArcLayout
  activeArcStrokeWidth?: number
  arcGlowBounds?: { x: number; y: number; width: number; height: number }
  designedSlotOrder?: string[]
  designedRotations?: Record<string, number>
  /** Figma short labels keyed by designed slot id. */
  designedLabelsBySlot?: Record<string, SlotDisplayLabels>
  preferredMatchers?: Array<{ slot: string; match: (text: string) => boolean }>
  /** Clip each Figma arc to this sweep so 5+ slots don't overlap (Q3). */
  arcClipSweepDeg?: number
  pillOrbitRadius?: number
}

/**
 * Fit API options into a rotated-arc dial design.
 * Uses designed rotations + short labels when counts match; otherwise even spacing
 * with abbreviated API labels.
 */
export function fitApiOptionsToRotatedDial(
  template: RotatedDialTemplate,
  apiOptions: QuestionnaireOption[],
): FittedDialResult {
  const options = collectApiDialOptions(apiOptions)
  if (options.length === 0) {
    return {
      config: emptyRotatedConfig(template),
      centerLabels: {},
      overflow: [],
    }
  }

  const designedOrder = template.designedSlotOrder ?? []
  const designedRotations = template.designedRotations ?? {}
  const useDesigned =
    designedOrder.length > 0 &&
    options.length === designedOrder.length &&
    designedOrder.every((slot) => slot in designedRotations)

  let assignments: Array<{
    option: ApiDialOption
    slot: string
    rotation: number
    display: SlotDisplayLabels
  }>

  if (useDesigned) {
    const { bySlot, overflow } = assignOptionsToSlots(
      options,
      designedOrder,
      template.preferredMatchers ?? [],
    )
    const orderedSlots = designedOrder.filter((slot) => bySlot.has(slot))
    if (overflow.length > 0) {
      assignments = evenlySpacedAssignments(options)
    } else {
      assignments = orderedSlots.map((slot) => {
        const option = bySlot.get(slot)!
        return {
          option,
          slot,
          rotation: designedRotations[slot],
          display: abbreviateDialLabel(option.label),
        }
      })
    }
  } else {
    assignments = evenlySpacedAssignments(options)
  }

  return buildRotatedConfig(template, assignments)
}

function evenlySpacedAssignments(
  options: ApiDialOption[],
): Array<{
  option: ApiDialOption
  slot: string
  rotation: number
  display: SlotDisplayLabels
}> {
  const n = options.length
  return options.map((option, index) => {
    const rotation = n === 0 ? 0 : -90 + (360 * index) / n
    return {
      option,
      slot: `slot-${index}`,
      rotation,
      display: abbreviateDialLabel(option.label),
    }
  })
}

function emptyRotatedConfig(template: RotatedDialTemplate): RadialDialConfig<string> {
  return {
    idPrefix: template.idPrefix,
    width: template.width,
    height: template.height,
    dialOffsetX: template.dialOffsetX,
    dialOffsetY: template.dialOffsetY,
    dialSize: template.dialSize,
    hubRadius: template.hubRadius,
    unselectedArcs: [],
    slotSelection: {
      baseArc: template.baseArc,
      slotRotations: {},
      slotOrder: [],
      optionSlots: {},
      activeArcStrokeWidth: template.activeArcStrokeWidth ?? 4,
    },
    arcGlowBounds: template.arcGlowBounds,
    rotationByOption: {},
    pills: [],
  }
}

function buildRotatedConfig(
  template: RotatedDialTemplate,
  assignments: Array<{
    option: ApiDialOption
    slot: string
    rotation: number
    display: SlotDisplayLabels
  }>,
): FittedDialResult {
  const slotRotations: Record<string, number> = {}
  const optionSlots: Record<string, string> = {}
  const rotationByOption: Record<string, number> = {}
  const centerLabels: Record<string, string> = {}
  const pills: RadialDialPillConfig[] = []
  const slotOrder: string[] = []

  for (const { option, slot, rotation, display } of assignments) {
    slotOrder.push(slot)
    slotRotations[slot] = rotation
    optionSlots[option.value] = slot
    rotationByOption[option.value] = (rotation + 90 + 360) % 360
    centerLabels[option.value] = display.center
    pills.push({
      id: option.value,
      label: display.pill,
      labelLines: display.labelLines,
    })
  }

  return {
    config: {
      idPrefix: template.idPrefix,
      width: template.width,
      height: template.height,
      dialOffsetX: template.dialOffsetX,
      dialOffsetY: template.dialOffsetY,
      dialSize: template.dialSize,
      hubRadius: template.hubRadius,
      unselectedArcs: [],
      slotSelection: {
        baseArc: template.baseArc,
        slotRotations,
        slotOrder,
        optionSlots,
        activeArcStrokeWidth: template.activeArcStrokeWidth ?? 4,
        arcClipSweepDeg: template.arcClipSweepDeg,
      },
      arcGlowBounds: template.arcGlowBounds,
      rotationByOption,
      pills,
      pillOrbitRadius: template.pillOrbitRadius,
    },
    centerLabels,
    overflow: [],
  }
}

type FixedDialTemplate = {
  idPrefix: string
  width: number
  height: number
  dialOffsetX: number
  dialOffsetY: number
  dialSize: number
  hubRadius: number
  slotArcs: Record<string, RadialDialArcLayout>
  slotOrder: string[]
  pillClassBySlot?: Record<string, string>
  rotationBySlot?: Record<string, number>
  designedLabelsBySlot?: Record<string, SlotDisplayLabels>
  preferredMatchers?: Array<{ slot: string; match: (text: string) => boolean }>
  activeArcStrokeWidth?: number
  arcGlowBounds?: { x: number; y: number; width: number; height: number }
  pillOrbitRadius?: number
}

/**
 * Fit API options into fixed designed arc slots (sit duration / daily walking).
 * Uses Figma short labels + absolute pill positions for stable alignment.
 */
export function fitApiOptionsToFixedDial(
  template: FixedDialTemplate,
  apiOptions: QuestionnaireOption[],
): FittedDialResult {
  const options = collectApiDialOptions(apiOptions)
  const { bySlot, overflow } = assignOptionsToSlots(
    options,
    template.slotOrder,
    template.preferredMatchers ?? [],
  )

  const optionSlots: Record<string, string> = {}
  const rotationByOption: Record<string, number> = {}
  const centerLabels: Record<string, string> = {}
  const pills: RadialDialPillConfig[] = []
  const usedSlots: string[] = []
  const usedArcs: Record<string, RadialDialArcLayout> = {}

  for (const slot of template.slotOrder) {
    const option = bySlot.get(slot)
    if (!option) continue
    const arc = template.slotArcs[slot]
    if (!arc) continue

    const display = abbreviateDialLabel(option.label)

    usedSlots.push(slot)
    usedArcs[slot] = arc
    optionSlots[option.value] = slot
    rotationByOption[option.value] = template.rotationBySlot?.[slot] ?? 0
    centerLabels[option.value] = display.center
    pills.push({
      id: option.value,
      label: display.pill,
      className: template.pillClassBySlot?.[slot],
      labelLines: display.labelLines,
    })
  }

  return {
    config: {
      idPrefix: template.idPrefix,
      width: template.width,
      height: template.height,
      dialOffsetX: template.dialOffsetX,
      dialOffsetY: template.dialOffsetY,
      dialSize: template.dialSize,
      hubRadius: template.hubRadius,
      unselectedArcs: [],
      slotSelection: {
        slotArcs: usedArcs,
        slotOrder: usedSlots,
        optionSlots,
        activeArcStrokeWidth: template.activeArcStrokeWidth ?? 4,
      },
      arcGlowBounds: template.arcGlowBounds,
      rotationByOption,
      pills,
      pillOrbitRadius: template.pillOrbitRadius,
    },
    centerLabels,
    overflow,
  }
}
