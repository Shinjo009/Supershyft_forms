import { memo, useCallback, useRef, type RefObject } from 'react'
import { RadialDialPill } from './RadialDialPill'
import { arcPointerTouch, computeRadialPillAnchor } from './arcPathGeometry'
import type { RadialDialArcLayout, RadialDialConfig } from './radialDialShared'
import { getSlotArcLayout } from './radialDialShared'
import { MCQ_DIAL_DESKTOP_CLASS } from '../mcq/mcqLayout'
import { useDialRotationDriver } from './useAnimatedDialRotation'

function NestedGreyArc({ layout }: { layout: RadialDialArcLayout }) {
  return (
    <svg
      x={layout.x}
      y={layout.y}
      width={layout.w}
      height={layout.h}
      viewBox={`0 0 ${layout.vbW} ${layout.vbH}`}
      overflow="visible"
    >
      <path d={layout.path} fill="white" fillOpacity="0.2" />
    </svg>
  )
}

function UnselectedDial({ arcs }: { arcs: RadialDialArcLayout[] }) {
  return (
    <>
      {arcs.map((layout, index) => (
        <NestedGreyArc key={index} layout={layout} />
      ))}
    </>
  )
}

function NestedOrangeArcFill({
  layout,
  strokeWidth = 0,
}: {
  layout: RadialDialArcLayout
  strokeWidth?: number
}) {
  return (
    <svg
      x={layout.x}
      y={layout.y}
      width={layout.w}
      height={layout.h}
      viewBox={`0 0 ${layout.vbW} ${layout.vbH}`}
      overflow="visible"
    >
      <path
        d={layout.path}
        fill="#FF8800"
        stroke="#FF8800"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function NestedOrangeArcGlow({
  layout,
  glowId,
  strokeWidth = 0,
}: {
  layout: RadialDialArcLayout
  glowId: string
  strokeWidth?: number
}) {
  // Pad the nested SVG so Gaussian blur isn't clipped at the arc tip.
  const pad = 28
  const scaleX = layout.vbW / Math.max(layout.w, 1)
  const scaleY = layout.vbH / Math.max(layout.h, 1)
  const padVbX = pad * scaleX
  const padVbY = pad * scaleY

  return (
    <svg
      x={layout.x - pad}
      y={layout.y - pad}
      width={layout.w + pad * 2}
      height={layout.h + pad * 2}
      viewBox={`${-padVbX} ${-padVbY} ${layout.vbW + padVbX * 2} ${layout.vbH + padVbY * 2}`}
      overflow="visible"
    >
      <g filter={`url(#${glowId})`}>
        <path
          d={layout.path}
          fill="#FF8800"
          stroke="#FF8800"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

function NestedOrangeArc({
  layout,
  glowId,
}: {
  layout: RadialDialArcLayout
  glowId: string
}) {
  return (
    <svg
      x={layout.x}
      y={layout.y}
      width={layout.w}
      height={layout.h}
      viewBox={`0 0 ${layout.vbW} ${layout.vbH}`}
      overflow="visible"
    >
      <g filter={`url(#${glowId})`}>
        <path d={layout.path} fill="#FF8800" />
      </g>
    </svg>
  )
}

/** Pie-wedge clip in dial-local space — centerDeg 0 = +x (base arc seat). */
function arcClipWedgePath(
  cx: number,
  cy: number,
  sweepDeg: number,
  centerDeg = 0,
  radius = 200,
): string {
  const half = sweepDeg / 2
  const start = ((centerDeg - half) * Math.PI) / 180
  const end = ((centerDeg + half) * Math.PI) / 180
  const x0 = cx + radius * Math.cos(start)
  const y0 = cy + radius * Math.sin(start)
  const x1 = cx + radius * Math.cos(end)
  const y1 = cy + radius * Math.sin(end)
  const large = sweepDeg > 180 ? 1 : 0
  return `M${cx} ${cy}L${x0} ${y0}A${radius} ${radius} 0 ${large} 1 ${x1} ${y1}Z`
}

function RotatedArc({
  layout,
  rotation,
  pivotX,
  pivotY,
  active,
  strokeWidth = 0,
  clipSweepDeg,
  clipId,
}: {
  layout: RadialDialArcLayout
  rotation: number
  pivotX: number
  pivotY: number
  active: boolean
  strokeWidth?: number
  clipSweepDeg?: number
  clipId?: string
}) {
  const arc = active ? (
    <NestedOrangeArcFill layout={layout} strokeWidth={strokeWidth} />
  ) : (
    <NestedGreyArc layout={layout} />
  )

  const rotated =
    rotation === 0 ? arc : <g transform={`rotate(${rotation} ${pivotX} ${pivotY})`}>{arc}</g>

  if (!clipSweepDeg || !clipId) {
    return rotated
  }

  // Clip in dial space, wedge centered on this slot's angle (same as rotation).
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <path d={arcClipWedgePath(pivotX, pivotY, clipSweepDeg, rotation)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{rotated}</g>
    </>
  )
}

function RotatedArcGlow({
  layout,
  rotation,
  pivotX,
  pivotY,
  glowId,
  strokeWidth = 0,
  clipSweepDeg,
  clipId,
}: {
  layout: RadialDialArcLayout
  rotation: number
  pivotX: number
  pivotY: number
  glowId: string
  strokeWidth?: number
  clipSweepDeg?: number
  clipId?: string
}) {
  const glow = <NestedOrangeArcGlow layout={layout} glowId={glowId} strokeWidth={strokeWidth} />

  const rotated =
    rotation === 0 ? glow : <g transform={`rotate(${rotation} ${pivotX} ${pivotY})`}>{glow}</g>

  if (!clipSweepDeg || !clipId) {
    return rotated
  }

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <path d={arcClipWedgePath(pivotX, pivotY, clipSweepDeg, rotation)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{rotated}</g>
    </>
  )
}

function pointerLineFromTouch(
  touchLocal: { x: number; y: number },
  config: RadialDialConfig<string>,
): { x1: number; y1: number; x2: number; y2: number } {
  const dialCenter = config.dialSize / 2
  const dialCx = config.dialOffsetX + dialCenter
  const dialCy = config.dialOffsetY + dialCenter
  const touchX = config.dialOffsetX + touchLocal.x
  const touchY = config.dialOffsetY + touchLocal.y
  const dx = touchX - dialCx
  const dy = touchY - dialCy
  const dist = Math.hypot(dx, dy) || 1

  return {
    x1: dialCx + (dx / dist) * config.hubRadius,
    y1: dialCy + (dy / dist) * config.hubRadius,
    x2: touchX,
    y2: touchY,
  }
}

/** Hub line end point on the inner arc edge along the ray from dial center. */
function computeSlotPointerLine<T extends string>(
  config: RadialDialConfig<T>,
  selected: T,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const { slotSelection, dialSize } = config
  const dialCenter = dialSize / 2
  const dialCx = config.dialOffsetX + dialCenter
  const dialCy = config.dialOffsetY + dialCenter

  if (!slotSelection) {
    return {
      x1: dialCx,
      y1: dialCy - config.hubRadius,
      x2: dialCx,
      y2: dialCy - config.hubRadius - 32,
    }
  }

  const slotId = slotSelection.optionSlots[selected]
  if (!slotId) {
    return null
  }

  const { layout: arc, rotation: slotRotation } = getSlotArcLayout(slotSelection, slotId)
  if (!arc?.path) {
    return null
  }

  const touchLocal = arcPointerTouch(arc, dialCenter, config.hubRadius, slotRotation)
  return pointerLineFromTouch(touchLocal, config as RadialDialConfig<string>)
}

function GeneratedSlotDialInner<T extends string>({
  config,
  selected,
  idPrefix,
}: {
  config: RadialDialConfig<T>
  selected: T | null
  idPrefix: string
}) {
  const { slotSelection } = config
  if (!slotSelection) {
    return null
  }

  const pivotX = config.dialSize / 2
  const pivotY = config.dialSize / 2
  const activeSlot = selected !== null ? slotSelection.optionSlots[selected] : null
  const activeArcStrokeWidth = slotSelection.activeArcStrokeWidth ?? 0
  const clipSweepDeg = slotSelection.arcClipSweepDeg
  const sharedGlowId = `${idPrefix}-slot-arc-glow`

  return (
    <g transform={`translate(${config.dialOffsetX} ${config.dialOffsetY})`}>
      {activeSlot ? (() => {
        const { layout, rotation } = getSlotArcLayout(slotSelection, activeSlot)
        return (
          <RotatedArcGlow
            layout={layout}
            rotation={rotation}
            pivotX={pivotX}
            pivotY={pivotY}
            glowId={sharedGlowId}
            strokeWidth={activeArcStrokeWidth}
            clipSweepDeg={clipSweepDeg}
            clipId={clipSweepDeg ? `${idPrefix}-clip-glow-${activeSlot}` : undefined}
          />
        )
      })() : null}
      {slotSelection.slotOrder
        .filter((slotId) => slotId !== activeSlot)
        .map((slotId) => {
          const { layout, rotation } = getSlotArcLayout(slotSelection, slotId)
          return (
            <RotatedArc
              key={slotId}
              layout={layout}
              rotation={rotation}
              pivotX={pivotX}
              pivotY={pivotY}
              active={false}
              clipSweepDeg={clipSweepDeg}
              clipId={clipSweepDeg ? `${idPrefix}-clip-grey-${slotId}` : undefined}
            />
          )
        })}
      {activeSlot ? (
        (() => {
          const { layout, rotation } = getSlotArcLayout(slotSelection, activeSlot)
          return (
            <RotatedArc
              key={activeSlot}
              layout={layout}
              rotation={rotation}
              pivotX={pivotX}
              pivotY={pivotY}
              active
              strokeWidth={activeArcStrokeWidth}
              clipSweepDeg={clipSweepDeg}
              clipId={clipSweepDeg ? `${idPrefix}-clip-active-${activeSlot}` : undefined}
            />
          )
        })()
      ) : null}
    </g>
  )
}

/** Arcs only re-render when selection changes — not every animation frame. */
const GeneratedSlotDial = memo(GeneratedSlotDialInner) as typeof GeneratedSlotDialInner

function SlotPointerLine({
  x1,
  y1,
  x2,
  y2,
  lineRef,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  lineRef?: RefObject<SVGLineElement | null>
}) {
  return (
    <line
      ref={lineRef}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="#FF8800"
      strokeOpacity="0.5"
      strokeWidth="2"
      strokeLinecap="round"
    />
  )
}

/** Dial-local pointer for a base arc at rotation 0 (hub → inner arc edge). */
function baseArcPointerLocal(
  arc: RadialDialArcLayout,
  dialCenter: number,
  hubRadius: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const touch = arcPointerTouch(arc, dialCenter, hubRadius, 0)
  const dx = touch.x - dialCenter
  const dy = touch.y - dialCenter
  const dist = Math.hypot(dx, dy) || 1

  return {
    x1: dialCenter + (dx / dist) * hubRadius,
    y1: dialCenter + (dy / dist) * hubRadius,
    x2: touch.x,
    y2: touch.y,
  }
}

/** Degrees clockwise from top for a pointer tip relative to dial center. */
function pointerAngleDeg(
  pointer: { x2: number; y2: number },
  dialCx: number,
  dialCy: number,
): number {
  const rad = Math.atan2(pointer.y2 - dialCy, pointer.x2 - dialCx)
  let deg = (rad * 180) / Math.PI + 90
  if (deg < 0) {
    deg += 360
  }
  return deg
}

function shortestDisplayAngleDelta(from: number, to: number) {
  let delta = to - from
  while (delta > 180) delta -= 360
  while (delta < -180) delta += 360
  return delta
}

/** Pointer tip on a circle at `rotation` degrees (0 = top, clockwise). */
function pointerFromRotation(
  config: RadialDialConfig<string>,
  rotationDeg: number,
  reach: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const dialCx = config.dialOffsetX + config.dialSize / 2
  const dialCy = config.dialOffsetY + config.dialSize / 2
  const rad = ((rotationDeg - 90) * Math.PI) / 180
  const dx = Math.cos(rad)
  const dy = Math.sin(rad)

  return {
    x1: dialCx + dx * config.hubRadius,
    y1: dialCy + dy * config.hubRadius,
    x2: dialCx + dx * reach,
    y2: dialCy + dy * reach,
  }
}

/**
 * Rotated-slot dials (physical activity / weekly leisure):
 * orange arc + center line share one SVG rotate — always perfectly aligned,
 * and the whole selection sweeps when switching options.
 * Transform is updated imperatively during animation (no React re-renders).
 */
function RotatedSlotSelectedDial<T extends string>({
  config,
  selected,
  rotateGroupRef,
  clipPathRef,
  pointerGroupRef,
}: {
  config: RadialDialConfig<T>
  selected: T
  rotateGroupRef: RefObject<SVGGElement | null>
  clipPathRef: RefObject<SVGPathElement | null>
  pointerGroupRef: RefObject<SVGGElement | null>
}) {
  const { slotSelection } = config
  if (!slotSelection?.baseArc) return null

  const dialCenter = config.dialSize / 2
  const pivotX = dialCenter
  const pivotY = dialCenter
  const baseArc = slotSelection.baseArc
  const strokeWidth = slotSelection.activeArcStrokeWidth ?? 0
  const pointer = baseArcPointerLocal(baseArc, dialCenter, config.hubRadius)
  const clipSweepDeg = slotSelection.arcClipSweepDeg
  const activeSlot = slotSelection.optionSlots[selected]
  if (!activeSlot) {
    return (
      <g transform={`translate(${config.dialOffsetX} ${config.dialOffsetY})`}>
        {slotSelection.slotOrder.map((slotId) => {
          const { layout, rotation } = getSlotArcLayout(slotSelection, slotId)
          if (!layout?.path) return null
          return (
            <RotatedArc
              key={slotId}
              layout={layout}
              rotation={rotation}
              pivotX={pivotX}
              pivotY={pivotY}
              active={false}
              clipSweepDeg={clipSweepDeg}
              clipId={clipSweepDeg ? `${config.idPrefix}-clip-grey-${slotId}` : undefined}
            />
          )
        })}
      </g>
    )
  }

  const orangeClipId = clipSweepDeg ? `${config.idPrefix}-clip-orange-active` : undefined
  const sharedGlowId = `${config.idPrefix}-slot-arc-glow`
  const initialRotation = getSlotArcLayout(slotSelection, activeSlot).rotation

  const orangeContent = (
    <>
      <NestedOrangeArcGlow layout={baseArc} glowId={sharedGlowId} strokeWidth={strokeWidth} />
      <NestedOrangeArcFill layout={baseArc} strokeWidth={strokeWidth} />
    </>
  )

  return (
    <g transform={`translate(${config.dialOffsetX} ${config.dialOffsetY})`}>
      {slotSelection.slotOrder
        .filter((slotId) => slotId !== activeSlot)
        .map((slotId) => {
          const { layout, rotation } = getSlotArcLayout(slotSelection, slotId)
          return (
            <RotatedArc
              key={slotId}
              layout={layout}
              rotation={rotation}
              pivotX={pivotX}
              pivotY={pivotY}
              active={false}
              clipSweepDeg={clipSweepDeg}
              clipId={clipSweepDeg ? `${config.idPrefix}-clip-grey-${slotId}` : undefined}
            />
          )
        })}

      {clipSweepDeg && orangeClipId ? (
        <>
          <defs>
            <clipPath id={orangeClipId}>
              <path
                ref={clipPathRef}
                d={arcClipWedgePath(pivotX, pivotY, clipSweepDeg, initialRotation)}
              />
            </clipPath>
          </defs>
          <g clipPath={`url(#${orangeClipId})`}>
            <g
              ref={rotateGroupRef}
              transform={`rotate(${initialRotation} ${pivotX} ${pivotY})`}
              style={{ willChange: 'transform' }}
            >
              {orangeContent}
            </g>
          </g>
          <g
            ref={pointerGroupRef}
            transform={`rotate(${initialRotation} ${pivotX} ${pivotY})`}
            style={{ willChange: 'transform' }}
          >
            <SlotPointerLine {...pointer} />
          </g>
        </>
      ) : (
        <g
          ref={rotateGroupRef}
          transform={`rotate(${initialRotation} ${pivotX} ${pivotY})`}
          style={{ willChange: 'transform' }}
        >
          {orangeContent}
          <SlotPointerLine {...pointer} />
        </g>
      )}
    </g>
  )
}

/**
 * Fixed-slot dials (sit duration / daily walking):
 * arcs stay in designed seats; center line animates to each arc's geometric bisector.
 * Pointer attributes are updated imperatively during animation.
 */
function FixedSlotSelectedDial<T extends string>({
  config,
  selected,
  pointerLineRef,
}: {
  config: RadialDialConfig<T>
  selected: T
  pointerLineRef: RefObject<SVGLineElement | null>
}) {
  const targetPointer = computeSlotPointerLine(config, selected)

  return (
    <>
      <GeneratedSlotDial config={config} selected={selected} idPrefix={config.idPrefix} />
      {targetPointer ? <SlotPointerLine {...targetPointer} lineRef={pointerLineRef} /> : null}
    </>
  )
}

function SlotSelectedDial<T extends string>({
  config,
  selected,
  pointerLineRef,
  rotateGroupRef,
  clipPathRef,
  pointerGroupRef,
}: {
  config: RadialDialConfig<T>
  selected: T
  pointerLineRef: RefObject<SVGLineElement | null>
  rotateGroupRef: RefObject<SVGGElement | null>
  clipPathRef: RefObject<SVGPathElement | null>
  pointerGroupRef: RefObject<SVGGElement | null>
}) {
  if (config.slotSelection?.baseArc) {
    return (
      <RotatedSlotSelectedDial
        config={config}
        selected={selected}
        rotateGroupRef={rotateGroupRef}
        clipPathRef={clipPathRef}
        pointerGroupRef={pointerGroupRef}
      />
    )
  }

  return (
    <FixedSlotSelectedDial
      config={config}
      selected={selected}
      pointerLineRef={pointerLineRef}
    />
  )
}

function SelectedDial({
  config,
  rotation,
}: {
  config: RadialDialConfig<string>
  rotation: number
}) {
  const { selectedGroup, idPrefix } = config

  if (!selectedGroup) {
    return null
  }

  const usesDialSpace = selectedGroup.greyArcs !== undefined

  const arcs = (
    <>
      {selectedGroup.greyPaths?.map((path, index) => (
        <path key={`grey-${index}`} d={path} fill="white" fillOpacity="0.2" />
      ))}
      {selectedGroup.greyArcs?.map((layout, index) => (
        <NestedGreyArc key={`grey-arc-${index}`} layout={layout} />
      ))}
      {selectedGroup.orangePath ? (
        <g filter={`url(#${idPrefix}-arc-glow)`}>
          <path d={selectedGroup.orangePath} fill="#FF8800" />
        </g>
      ) : null}
      {selectedGroup.orangeArc ? (
        <NestedOrangeArc layout={selectedGroup.orangeArc} glowId={`${idPrefix}-arc-glow`} />
      ) : null}
      {'x1' in selectedGroup.pointer ? (
        <line
          x1={selectedGroup.pointer.x1}
          y1={selectedGroup.pointer.y1}
          x2={selectedGroup.pointer.x2}
          y2={selectedGroup.pointer.y2}
          stroke="#FF8800"
          strokeOpacity="0.5"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <g
          transform={`translate(${selectedGroup.pointer.translateX} ${selectedGroup.pointer.translateY}) rotate(${selectedGroup.pointer.rotate})`}
        >
          <line
            x1="1"
            y1="1"
            x2={selectedGroup.pointer.lineEndX}
            y2="1"
            stroke="#FF8800"
            strokeOpacity="0.5"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}
    </>
  )

  const content = usesDialSpace ? (
    <g transform={`translate(${config.dialOffsetX} ${config.dialOffsetY})`}>{arcs}</g>
  ) : (
    arcs
  )

  if (rotation === 0) {
    return content
  }

  return (
    <g transform={`rotate(${rotation} ${selectedGroup.pivotX} ${selectedGroup.pivotY})`}>
      {content}
    </g>
  )
}

function IdleCenterHub({
  config,
}: {
  config: RadialDialConfig<string>
}) {
  const dialCx = config.dialOffsetX + config.dialSize / 2
  const dialCy = config.dialOffsetY + config.dialSize / 2

  return (
    <g
      transform={`translate(${dialCx - config.hubRadius} ${dialCy - config.hubRadius})`}
      filter={`url(#${config.idPrefix}-hub-glow)`}
    >
      <circle cx={config.hubRadius} cy={config.hubRadius} r={config.hubRadius} fill="black" fillOpacity="0.2" />
      <circle
        cx={config.hubRadius}
        cy={config.hubRadius}
        r={config.hubRadius - 0.5}
        stroke="#FF8800"
        strokeOpacity="0.5"
      />
    </g>
  )
}

function SelectedCenterHub({
  config,
  label,
}: {
  config: RadialDialConfig<string>
  label: string
}) {
  const dialCx = config.dialOffsetX + config.dialSize / 2
  const dialCy = config.dialOffsetY + config.dialSize / 2
  const size = config.hubRadius * 2
  const text = (label || '').trim()
  const fontSize = text.length > 9 ? 9 : text.length > 7 ? 10 : 11

  return (
    <g filter={`url(#${config.idPrefix}-hub-glow)`}>
      <circle cx={dialCx} cy={dialCy} r={config.hubRadius} fill="black" fillOpacity="0.2" />
      <circle
        cx={dialCx}
        cy={dialCy}
        r={config.hubRadius - 0.5}
        stroke="#FF8800"
        strokeOpacity="0.5"
      />
      <foreignObject
        x={dialCx - config.hubRadius}
        y={dialCy - config.hubRadius}
        width={size}
        height={size}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: 'white',
            fontSize,
            fontWeight: 500,
            fontFamily: 'DM Sans, sans-serif',
            lineHeight: 1.05,
            padding: 3,
            boxSizing: 'border-box',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </div>
      </foreignObject>
    </g>
  )
}

/** Reusable radial dial — grey arcs when unselected, orange arc replaces active slot when selected. */
export function RadialDialSelector<T extends string>({
  config,
  selected,
  onSelect,
  centerLabelByOption,
}: {
  config: RadialDialConfig<T>
  selected: T | null
  onSelect: (value: T) => void
  centerLabelByOption: Record<T, string>
}) {
  const dialCx = config.dialOffsetX + config.dialSize / 2
  const dialCy = config.dialOffsetY + config.dialSize / 2
  const isRotatedMode = Boolean(config.slotSelection?.baseArc)

  // Ignore stale answers that no longer map to a dial slot (prevents render crashes).
  const resolvedSelected =
    selected !== null && config.slotSelection
      ? config.slotSelection.optionSlots[selected]
        ? selected
        : null
      : selected

  const pointerLineRef = useRef<SVGLineElement | null>(null)
  const rotateGroupRef = useRef<SVGGElement | null>(null)
  const pointerGroupRef = useRef<SVGGElement | null>(null)
  const clipPathRef = useRef<SVGPathElement | null>(null)

  const selectedRef = useRef(resolvedSelected)
  selectedRef.current = resolvedSelected
  const configRef = useRef(config)
  configRef.current = config

  let animationTarget: number | null = null
  if (config.slotSelection && resolvedSelected !== null) {
    if (isRotatedMode) {
      const slotId = config.slotSelection.optionSlots[resolvedSelected]
      if (slotId) {
        animationTarget = getSlotArcLayout(config.slotSelection, slotId).rotation
      }
    } else {
      const targetPointer = computeSlotPointerLine(config, resolvedSelected)
      if (targetPointer) {
        animationTarget = pointerAngleDeg(targetPointer, dialCx, dialCy)
      }
    }
  }

  const applyRotation = useCallback(
    (rotation: number) => {
      const cfg = configRef.current as RadialDialConfig<string>
      const current = selectedRef.current
      if (!cfg.slotSelection || current === null) return

      if (cfg.slotSelection.baseArc) {
        const pivot = cfg.dialSize / 2
        const transform = `rotate(${rotation} ${pivot} ${pivot})`
        rotateGroupRef.current?.setAttribute('transform', transform)
        pointerGroupRef.current?.setAttribute('transform', transform)
        const clipSweep = cfg.slotSelection.arcClipSweepDeg
        if (clipSweep && clipPathRef.current) {
          clipPathRef.current.setAttribute(
            'd',
            arcClipWedgePath(pivot, pivot, clipSweep, rotation),
          )
        }
        return
      }

      const line = pointerLineRef.current
      if (!line) return

      const targetPointer = computeSlotPointerLine(cfg, current)
      if (!targetPointer) return

      const cx = cfg.dialOffsetX + cfg.dialSize / 2
      const cy = cfg.dialOffsetY + cfg.dialSize / 2
      const targetAngle = pointerAngleDeg(targetPointer, cx, cy)
      const reach = Math.hypot(targetPointer.x2 - cx, targetPointer.y2 - cy)
      const settled = Math.abs(shortestDisplayAngleDelta(rotation, targetAngle)) < 0.35
      const pointer = settled
        ? targetPointer
        : pointerFromRotation(cfg, rotation, reach)

      line.setAttribute('x1', String(pointer.x1))
      line.setAttribute('y1', String(pointer.y1))
      line.setAttribute('x2', String(pointer.x2))
      line.setAttribute('y2', String(pointer.y2))
    },
    [],
  )

  useDialRotationDriver(config.slotSelection ? animationTarget : null, applyRotation)

  const staticRotation =
    !config.slotSelection && resolvedSelected !== null
      ? (config.rotationByOption[resolvedSelected] ?? 0)
      : 0

  const arcGlow = config.arcGlowBounds ?? {
    x: 76.882,
    y: 8.5,
    width: 167.19,
    height: 115.84,
  }

  return (
    <div
      className={`relative mx-auto ${MCQ_DIAL_DESKTOP_CLASS}`}
      style={{ width: config.width, height: config.height }}
    >
      <svg
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
        overflow="visible"
        aria-hidden
      >
        <defs>
          <filter
            id={`${config.idPrefix}-arc-glow`}
            x={arcGlow.x}
            y={arcGlow.y}
            width={arcGlow.width}
            height={arcGlow.height}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="10" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 0.533333 0 0 0 0 0 0 0 0 0.5 0"
            />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
          </filter>
          {/* Shared slot-arc glow — objectBoundingBox so tall arcs (e.g. left) aren't clipped */}
          <filter
            id={`${config.idPrefix}-slot-arc-glow`}
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="8" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 0.533333 0 0 0 0 0 0 0 0 0.5 0"
            />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
          </filter>
          <filter
            id={`${config.idPrefix}-hub-glow`}
            x={dialCx - config.hubRadius - 10}
            y={dialCy - config.hubRadius - 10}
            width={config.hubRadius * 2 + 20}
            height={config.hubRadius * 2 + 20}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="5" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 0.533333 0 0 0 0 0 0 0 0 0.5 0"
            />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
          </filter>
        </defs>

        {resolvedSelected === null ? (
          config.slotSelection ? (
            <GeneratedSlotDial config={config} selected={null} idPrefix={config.idPrefix} />
          ) : (
            <g transform={`translate(${config.dialOffsetX} ${config.dialOffsetY})`}>
              <UnselectedDial arcs={config.unselectedArcs} />
            </g>
          )
        ) : config.slotSelection ? (
          <SlotSelectedDial
            config={config}
            selected={resolvedSelected}
            pointerLineRef={pointerLineRef}
            rotateGroupRef={rotateGroupRef}
            clipPathRef={clipPathRef}
            pointerGroupRef={pointerGroupRef}
          />
        ) : (
          <SelectedDial config={config} rotation={staticRotation} />
        )}

        {resolvedSelected === null ? (
          <IdleCenterHub config={config} />
        ) : (
          <SelectedCenterHub
            config={config}
            label={centerLabelByOption[resolvedSelected] ?? ''}
          />
        )}
      </svg>

      {config.pills.map((pill) => {
        const anchor = pill.className
          ? null
          : computeRadialPillAnchor(config, pill.id as T)

        return (
          <RadialDialPill
            key={pill.id}
            label={pill.label}
            labelLines={pill.labelLines}
            selected={resolvedSelected === pill.id}
            className={pill.className}
            anchor={anchor}
            onClick={() => onSelect(pill.id as T)}
          />
        )
      })}
    </div>
  )
}
