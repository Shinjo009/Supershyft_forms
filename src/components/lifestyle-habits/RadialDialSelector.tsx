import { RadialDialPill } from './RadialDialPill'
import type { RadialDialArcLayout, RadialDialConfig } from './radialDialShared'
import { useAnimatedDialRotation } from './useAnimatedDialRotation'

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
  return (
    <svg
      x={layout.x}
      y={layout.y}
      width={layout.w}
      height={layout.h}
      viewBox={`0 0 ${layout.vbW} ${layout.vbH}`}
      overflow="visible"
    >
      <defs>
        <filter
          id={glowId}
          x="-20"
          y="-20"
          width={layout.vbW + 40}
          height={layout.vbH + 40}
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
          <feGaussianBlur stdDeviation="8" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 0.533333 0 0 0 0 0 0 0 0 0.5 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
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

function RotatedArc({
  layout,
  rotation,
  pivotX,
  pivotY,
  active,
  strokeWidth = 0,
}: {
  layout: RadialDialArcLayout
  rotation: number
  pivotX: number
  pivotY: number
  active: boolean
  strokeWidth?: number
}) {
  const arc = active ? (
    <NestedOrangeArcFill layout={layout} strokeWidth={strokeWidth} />
  ) : (
    <NestedGreyArc layout={layout} />
  )

  if (rotation === 0) {
    return arc
  }

  return (
    <g transform={`rotate(${rotation} ${pivotX} ${pivotY})`}>{arc}</g>
  )
}

function RotatedArcGlow({
  layout,
  rotation,
  pivotX,
  pivotY,
  glowId,
  strokeWidth = 0,
}: {
  layout: RadialDialArcLayout
  rotation: number
  pivotX: number
  pivotY: number
  glowId: string
  strokeWidth?: number
}) {
  const glow = <NestedOrangeArcGlow layout={layout} glowId={glowId} strokeWidth={strokeWidth} />

  if (rotation === 0) {
    return glow
  }

  return (
    <g transform={`rotate(${rotation} ${pivotX} ${pivotY})`}>{glow}</g>
  )
}

function getSlotArcLayout(
  slotSelection: NonNullable<RadialDialConfig<string>['slotSelection']>,
  slotId: string,
): { layout: RadialDialArcLayout; rotation: number } {
  const fixed = slotSelection.slotArcs?.[slotId]
  if (fixed) {
    return { layout: fixed, rotation: 0 }
  }

  return {
    layout: slotSelection.baseArc!,
    rotation: slotSelection.slotRotations?.[slotId] ?? 0,
  }
}

/** Inner-edge point along the ray from dial center toward an arc (fixed-slot dials). */
function innerTouchOnArc(
  arc: RadialDialArcLayout,
  dialCenterX: number,
  dialCenterY: number,
  strokeWidth = 0,
): { x: number; y: number } {
  const midX = arc.x + arc.w / 2
  const midY = arc.y + arc.h / 2
  const vx = midX - dialCenterX
  const vy = midY - dialCenterY
  const dist = Math.hypot(vx, vy) || 1
  const dirX = vx / dist
  const dirY = vy / dist

  const toCenterX = dialCenterX - midX
  const toCenterY = dialCenterY - midY
  const innerFactor = 0.58

  let anchorX: number
  let anchorY: number
  if (Math.abs(toCenterX) >= Math.abs(toCenterY)) {
    anchorX = toCenterX > 0 ? arc.x + arc.w * innerFactor : arc.x + arc.w * (1 - innerFactor)
    anchorY = dialCenterY
  } else {
    anchorX = dialCenterX
    anchorY = toCenterY > 0 ? arc.y + arc.h * innerFactor : arc.y + arc.h * (1 - innerFactor)
  }

  const anchorAlongRay =
    (anchorX - dialCenterX) * dirX + (anchorY - dialCenterY) * dirY
  const innerR = Math.max(anchorAlongRay, dist * 0.98) + strokeWidth * 0.5

  return {
    x: dialCenterX + dirX * innerR,
    y: dialCenterY + dirY * innerR,
  }
}

function GeneratedSlotDial<T extends string>({
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
            glowId={`${idPrefix}-arc-glow-${activeSlot}`}
            strokeWidth={activeArcStrokeWidth}
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
            />
          )
        })()
      ) : null}
    </g>
  )
}

function rotatePointAround(
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

/** Hub line end point on the inner arc edge — same height as dial center so the line meets the arc. */
function computeSlotPointerLine<T extends string>(
  config: RadialDialConfig<T>,
  selected: T,
): { x1: number; y1: number; x2: number; y2: number } {
  const { slotSelection, hubRadius, dialSize, dialOffsetX, dialOffsetY } = config
  const dialCx = dialOffsetX + dialSize / 2
  const dialCy = dialOffsetY + dialSize / 2
  const dialCenter = dialSize / 2

  if (!slotSelection) {
    return { x1: dialCx, y1: dialCy - hubRadius, x2: dialCx, y2: dialCy - hubRadius - 32 }
  }

  const slotId = slotSelection.optionSlots[selected]
  const { layout: arc, rotation: slotRotation } = getSlotArcLayout(slotSelection, slotId)

  const touchLocal = slotSelection.slotArcs?.[slotId]
    ? innerTouchOnArc(
        arc,
        dialCenter,
        dialCenter,
        slotSelection.activeArcStrokeWidth ?? 0,
      )
    : rotatePointAround(
        arc.x + arc.w * 0.58,
        dialCenter,
        dialCenter,
        dialCenter,
        slotRotation,
      )

  const touchX = dialOffsetX + touchLocal.x
  const touchY = dialOffsetY + touchLocal.y

  const dx = touchX - dialCx
  const dy = touchY - dialCy
  const dist = Math.hypot(dx, dy) || 1

  return {
    x1: dialCx + (dx / dist) * hubRadius,
    y1: dialCy + (dy / dist) * hubRadius,
    x2: touchX,
    y2: touchY,
  }
}

function SlotPointerLine({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
}) {
  return (
    <line
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

function SlotSelectedDial<T extends string>({
  config,
  selected,
}: {
  config: RadialDialConfig<T>
  selected: T
}) {
  const pointer = computeSlotPointerLine(config, selected)

  return (
    <>
      <GeneratedSlotDial config={config} selected={selected} idPrefix={config.idPrefix} />
      <SlotPointerLine {...pointer} />
    </>
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
      <text
        x={dialCx}
        y={dialCy + 4}
        textAnchor="middle"
        fill="white"
        fontSize="11"
        fontWeight="500"
        fontFamily="DM Sans, sans-serif"
      >
        {label}
      </text>
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
  const targetRotation = selected !== null ? config.rotationByOption[selected] : null
  const animatedRotation = useAnimatedDialRotation(
    config.slotSelection && selected !== null ? targetRotation : null,
  )
  const rotation = config.slotSelection ? animatedRotation : (targetRotation ?? 0)
  const dialCx = config.dialOffsetX + config.dialSize / 2
  const dialCy = config.dialOffsetY + config.dialSize / 2
  const arcGlow = config.arcGlowBounds ?? {
    x: 76.882,
    y: 8.5,
    width: 167.19,
    height: 115.84,
  }

  return (
    <div
      className="relative mx-auto"
      style={{ width: config.width, height: config.height }}
    >
      <svg
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="pointer-events-none absolute inset-0 size-full"
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

        {selected === null ? (
          config.slotSelection ? (
            <GeneratedSlotDial config={config} selected={null} idPrefix={config.idPrefix} />
          ) : (
            <g transform={`translate(${config.dialOffsetX} ${config.dialOffsetY})`}>
              <UnselectedDial arcs={config.unselectedArcs} />
            </g>
          )
        ) : config.slotSelection ? (
          <SlotSelectedDial config={config} selected={selected} />
        ) : (
          <SelectedDial config={config} rotation={rotation} />
        )}

        {selected === null ? (
          <IdleCenterHub config={config} />
        ) : (
          <SelectedCenterHub config={config} label={centerLabelByOption[selected]} />
        )}
      </svg>

      {config.pills.map((pill) => (
        <RadialDialPill
          key={pill.id}
          label={pill.label}
          selected={selected === pill.id}
          className={pill.className}
          onClick={() => onSelect(pill.id as T)}
        />
      ))}
    </div>
  )
}
