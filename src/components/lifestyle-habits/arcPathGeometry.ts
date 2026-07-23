import type { RadialDialArcLayout, RadialDialConfig, RadialDialPillConfig } from './radialDialShared'
import { RADIAL_PILL_ARC_GAP, getSlotArcLayout } from './radialDialShared'

export function rotatePointAround(
  x: number,
  y: number,
  cx: number,
  cy: number,
  degrees: number,
) {
  const rad = (degrees * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = x - cx
  const dy = y - cy
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  }
}

let measurePath: SVGPathElement | null = null

function getMeasurePath(): SVGPathElement | null {
  if (typeof document === 'undefined') {
    return null
  }

  if (!measurePath) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    measurePath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    svg.setAttribute('width', '0')
    svg.setAttribute('height', '0')
    svg.style.position = 'absolute'
    svg.style.visibility = 'hidden'
    svg.style.pointerEvents = 'none'
    svg.appendChild(measurePath)
    document.body.appendChild(svg)
  }

  return measurePath
}

/** Sample arc path into dial-local coordinates (same space as dialOffset transform). */
export function sampleArcPathPoints(
  arc: RadialDialArcLayout,
  dialCenter: number,
  rotation = 0,
  sampleCount = 96,
): { x: number; y: number }[] {
  const pathEl = getMeasurePath()
  if (!pathEl) {
    const midX = arc.x + arc.w / 2
    const midY = arc.y + arc.h / 2
    return [
      rotation === 0
        ? { x: midX, y: midY }
        : rotatePointAround(midX, midY, dialCenter, dialCenter, rotation),
    ]
  }

  pathEl.setAttribute('d', arc.path)
  const total = pathEl.getTotalLength()
  const points: { x: number; y: number }[] = []

  for (let i = 0; i <= sampleCount; i++) {
    const point = pathEl.getPointAtLength((total * i) / sampleCount)
    let x = arc.x + (point.x / arc.vbW) * arc.w
    let y = arc.y + (point.y / arc.vbH) * arc.h

    if (rotation !== 0) {
      const rotated = rotatePointAround(x, y, dialCenter, dialCenter, rotation)
      x = rotated.x
      y = rotated.y
    }

    points.push({ x, y })
  }

  return points
}

function raySegmentIntersectionT(
  cx: number,
  cy: number,
  dirX: number,
  dirY: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number | null {
  const segDx = bx - ax
  const segDy = by - ay
  const denom = dirX * segDy - dirY * segDx

  if (Math.abs(denom) < 1e-9) {
    return null
  }

  const t = ((ax - cx) * segDy - (ay - cy) * segDx) / denom
  const s = ((ax - cx) * dirY - (ay - cy) * dirX) / denom

  if (t >= 0 && s >= 0 && s <= 1) {
    return t
  }

  return null
}

/**
 * Angular midpoint of an arc path (bisects the visible segment), not the bbox center.
 * Uses the circular mean of outer-ridge samples so thick path outlines still bisect correctly.
 */
function arcBisectorDirection(
  points: { x: number; y: number }[],
  dialCenter: number,
  hubRadius: number,
): { dirX: number; dirY: number; dist: number } {
  const measured = points.map((point) => {
    const dx = point.x - dialCenter
    const dy = point.y - dialCenter
    return { dist: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) }
  })

  const beyondHub = measured.filter((entry) => entry.dist > hubRadius + 1)
  const pool = beyondHub.length > 0 ? beyondHub : measured
  let maxDist = 0
  let minDist = Number.POSITIVE_INFINITY

  for (const entry of pool) {
    maxDist = Math.max(maxDist, entry.dist)
    minDist = Math.min(minDist, entry.dist)
  }

  const outerThreshold = minDist + (maxDist - minDist) * 0.55
  const outer = pool.filter((entry) => entry.dist >= outerThreshold)
  const anglePool = outer.length > 0 ? outer : pool

  let sumX = 0
  let sumY = 0
  for (const entry of anglePool) {
    sumX += Math.cos(entry.angle)
    sumY += Math.sin(entry.angle)
  }

  const midAngle = Math.atan2(sumY, sumX)
  const dirX = Math.cos(midAngle)
  const dirY = Math.sin(midAngle)

  return { dirX, dirY, dist: maxDist || 1 }
}

/**
 * Ray from dial center through the arc's angular midpoint, intersected with the SVG path.
 * Returns the first hit along the ray beyond the hub radius.
 */
export function arcPointerTouch(
  arc: RadialDialArcLayout,
  dialCenter: number,
  hubRadius: number,
  rotation = 0,
): { x: number; y: number } {
  const points = sampleArcPathPoints(arc, dialCenter, rotation)
  const { dirX, dirY, dist } = arcBisectorDirection(points, dialCenter, hubRadius)
  const minT = hubRadius + 0.5
  let bestT: number | null = null

  for (let i = 0; i < points.length - 1; i++) {
    const t = raySegmentIntersectionT(
      dialCenter,
      dialCenter,
      dirX,
      dirY,
      points[i].x,
      points[i].y,
      points[i + 1].x,
      points[i + 1].y,
    )

    if (t !== null && t >= minT && (bestT === null || t < bestT)) {
      bestT = t
    }
  }

  if (bestT !== null) {
    return {
      x: dialCenter + dirX * bestT,
      y: dialCenter + dirY * bestT,
    }
  }

  // Fallback: closest sampled point to the ray beyond the hub.
  let fallbackT = dist
  let bestPerp = Number.POSITIVE_INFINITY

  for (const point of points) {
    const px = point.x - dialCenter
    const py = point.y - dialCenter
    const t = px * dirX + py * dirY

    if (t < minT) {
      continue
    }

    const perp = Math.abs(px * dirY - py * dirX)
    if (perp < bestPerp) {
      bestPerp = perp
      fallbackT = t
    }
  }

  return {
    x: dialCenter + dirX * fallbackT,
    y: dialCenter + dirY * fallbackT,
  }
}

/** Outermost point on the arc — farthest sampled point from dial center. */
export function arcOuterEdgePoint(
  arc: RadialDialArcLayout,
  dialCenter: number,
  _hubRadius: number,
  rotation = 0,
): { x: number; y: number; dirX: number; dirY: number } {
  const points = sampleArcPathPoints(arc, dialCenter, rotation)
  let farthest = points[0] ?? { x: dialCenter, y: dialCenter }
  let maxDist = 0

  for (const point of points) {
    const dist = Math.hypot(point.x - dialCenter, point.y - dialCenter)
    if (dist > maxDist) {
      maxDist = dist
      farthest = point
    }
  }

  const dx = farthest.x - dialCenter
  const dy = farthest.y - dialCenter
  const dist = Math.hypot(dx, dy) || 1

  return {
    x: farthest.x,
    y: farthest.y,
    dirX: dx / dist,
    dirY: dy / dist,
  }
}

function estimatePillHalfWidth(pill: RadialDialPillConfig): number {
  const label = pill.labelLines?.length
    ? pill.labelLines.reduce((longest, line) => (line.length > longest.length ? line : longest), '')
    : pill.label

  return Math.max(28, label.length * 3.25 + 12)
}

function estimatePillHalfHeight(pill: RadialDialPillConfig): number {
  return pill.labelLines?.length ? 20 : 16.5
}

/** Outermost point on the arc along a given ray from dial center. */
export function arcOuterPointAlongRay(
  arc: RadialDialArcLayout,
  dialCenter: number,
  dirX: number,
  dirY: number,
  rotation = 0,
): { x: number; y: number } {
  const points = sampleArcPathPoints(arc, dialCenter, rotation)
  let bestT = 0

  for (const point of points) {
    const px = point.x - dialCenter
    const py = point.y - dialCenter
    const t = px * dirX + py * dirY
    if (t > bestT) bestT = t
  }

  if (bestT <= 0) {
    const fallback = arcOuterEdgePoint(arc, dialCenter, 0, rotation)
    return { x: fallback.x, y: fallback.y }
  }

  return {
    x: dialCenter + dirX * bestT,
    y: dialCenter + dirY * bestT,
  }
}

/** Anchor point for a pill — along the same ray as the center-line (perfect alignment). */
export function computeRadialPillAnchor<T extends string>(
  config: RadialDialConfig<T>,
  optionId: T,
): { left: number; top: number } | null {
  const { slotSelection } = config
  if (!slotSelection) {
    return null
  }

  const slotId = slotSelection.optionSlots[optionId]
  if (!slotId) {
    return null
  }

  const pill = config.pills.find((entry) => entry.id === optionId)
  const dialCenter = config.dialSize / 2
  const { layout, rotation } = getSlotArcLayout(slotSelection, slotId)
  const touch = arcPointerTouch(layout, dialCenter, config.hubRadius, rotation)
  const dx = touch.x - dialCenter
  const dy = touch.y - dialCenter
  const dist = Math.hypot(dx, dy) || 1
  const dirX = dx / dist
  const dirY = dy / dist

  // Equal orbit keeps the option group circular (label length must not push pills in/out).
  if (config.pillOrbitRadius != null) {
    return {
      left: config.dialOffsetX + dialCenter + dirX * config.pillOrbitRadius,
      top: config.dialOffsetY + dialCenter + dirY * config.pillOrbitRadius,
    }
  }

  const outer = arcOuterPointAlongRay(layout, dialCenter, dirX, dirY, rotation)
  const pillHalfWidth = pill ? estimatePillHalfWidth(pill) : 28
  const pillHalfHeight = pill ? estimatePillHalfHeight(pill) : 16.5
  const radialExtent =
    Math.abs(dirX) * pillHalfWidth + Math.abs(dirY) * pillHalfHeight
  const totalOffset = RADIAL_PILL_ARC_GAP + radialExtent

  return {
    left: config.dialOffsetX + outer.x + dirX * totalOffset,
    top: config.dialOffsetY + outer.y + dirY * totalOffset,
  }
}
