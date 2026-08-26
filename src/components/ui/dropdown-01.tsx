import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

export type DropdownOption =
  | string
  | {
      value: string
      label?: ReactNode
      /** Closed-trigger display; defaults to `label` / `value`. */
      triggerLabel?: ReactNode
      disabled?: boolean
    }

type DropdownProps = {
  value: string
  onChange: (value: string) => void
  options: readonly DropdownOption[]
  placeholder?: string
}

type MenuPos = {
  top: number | 'auto'
  bottom: number | 'auto'
  left: number
  width: number
  maxHeight: number
  placement: 'up' | 'down'
}

const GAP = 8
const VIEWPORT_PAD = 12
const MAX_MENU_HEIGHT = 240

const triggerClass =
  'booking-field-input flex h-10 w-full items-center justify-between rounded-[8px] border border-transparent bg-white/5 px-4 text-left text-[16px] font-normal outline-none transition-colors focus:border-[#4b8d83]'

function optionValue(option: DropdownOption): string {
  return typeof option === 'string' ? option : option.value
}

function optionLabel(option: DropdownOption): ReactNode {
  if (typeof option === 'string') return option
  return option.label ?? option.value
}

function optionTriggerLabel(option: DropdownOption): ReactNode {
  if (typeof option === 'string') return option
  return option.triggerLabel ?? option.label ?? option.value
}

function optionDisabled(option: DropdownOption): boolean {
  return typeof option === 'string' ? false : Boolean(option.disabled)
}

function computeMenuPos(rect: DOMRect): MenuPos {
  const spaceBelow = window.innerHeight - rect.bottom - GAP - VIEWPORT_PAD
  const spaceAbove = rect.top - GAP - VIEWPORT_PAD
  const placement: 'up' | 'down' =
    spaceBelow < 140 && spaceAbove > spaceBelow ? 'up' : 'down'
  const available = placement === 'down' ? spaceBelow : spaceAbove
  const maxHeight = Math.max(96, Math.min(MAX_MENU_HEIGHT, available))

  let left = rect.left
  const width = rect.width
  left = Math.min(Math.max(VIEWPORT_PAD, left), window.innerWidth - width - VIEWPORT_PAD)

  if (placement === 'down') {
    return {
      top: rect.bottom + GAP,
      bottom: 'auto',
      left,
      width,
      maxHeight,
      placement,
    }
  }

  return {
    top: 'auto',
    bottom: window.innerHeight - rect.top + GAP,
    left,
    width,
    maxHeight,
    placement,
  }
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const [menuPos, setMenuPos] = useState<MenuPos>({
    top: 0,
    bottom: 'auto',
    left: 0,
    width: 0,
    maxHeight: MAX_MENU_HEIGHT,
    placement: 'down',
  })

  const updateMenuPos = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    setMenuPos(computeMenuPos(rect))
  }

  useLayoutEffect(() => {
    if (!isOpen) return
    updateMenuPos()
  }, [isOpen, options.length])

  useEffect(() => {
    if (!isOpen) return

    const close = () => setIsOpen(false)
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      close()
    }

    const onScroll = (event: Event) => {
      const target = event.target
      // Keep open while scrolling the menu itself; close on page/container scroll.
      if (menuRef.current && target instanceof Node && menuRef.current.contains(target)) return
      if (target === menuRef.current) return
      close()
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [isOpen])

  const selectedOption = options.find((option) => optionValue(option) === value)
  const triggerContent = selectedOption ? optionTriggerLabel(selectedOption) : placeholder
  const openOffsetY = menuPos.placement === 'up' ? 10 : -10

  return (
    <div ref={rootRef} className="relative z-20">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
        className={`${triggerClass} ${isOpen ? 'border-[#4b8d83]' : ''}`}
      >
        <span className={`truncate ${value ? 'text-[#cccccc]' : 'text-[14px] text-[rgba(211,211,211,0.5)]'}`}>
          {triggerContent}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="size-4 shrink-0 text-[rgba(211,211,211,0.5)]" />
        </motion.div>
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen ? (
            <motion.div
              ref={menuRef}
              id={menuId}
              role="listbox"
              initial={{ opacity: 0, y: openOffsetY }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: openOffsetY }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: menuPos.top,
                bottom: menuPos.bottom,
                left: menuPos.left,
                width: menuPos.width,
                maxHeight: menuPos.maxHeight,
                zIndex: 200,
              }}
              className="overflow-y-auto overflow-x-hidden rounded-[8px] border border-white/10 bg-[#1a1a1a]"
            >
              {options.map((option, index) => {
                const optionVal = optionValue(option)
                const selected = value === optionVal
                const disabled = optionDisabled(option)
                return (
                  <motion.button
                    key={optionVal}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={disabled}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
                    onClick={() => {
                      if (disabled) return
                      onChange(optionVal)
                      setIsOpen(false)
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-[16px] font-normal text-[#cccccc] transition-colors duration-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
                      index !== options.length - 1 ? 'border-b border-white/10' : ''
                    }`}
                  >
                    <span className="min-w-0 flex-1 whitespace-normal">{optionLabel(option)}</span>
                    {selected ? (
                      <motion.div
                        className="shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <Check className="size-4 text-[#4b8d83]" />
                      </motion.div>
                    ) : null}
                  </motion.button>
                )
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
