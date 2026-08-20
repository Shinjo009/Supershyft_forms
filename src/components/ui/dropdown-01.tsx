import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

type DropdownProps = {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
}

const triggerClass =
  'booking-field-input flex h-10 w-full items-center justify-between rounded-[8px] border border-transparent bg-white/5 px-4 text-left text-[16px] font-normal outline-none transition-colors focus:border-[#4b8d83]'

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 })

  const updateMenuPos = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    setMenuPos({ top: rect.bottom + 8, left: rect.left, width: rect.width })
  }

  useEffect(() => {
    if (!isOpen) return
    updateMenuPos()

    const close = () => setIsOpen(false)
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      const menu = document.getElementById(menuId)
      if (menu?.contains(target)) return
      close()
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [isOpen, menuId])

  const label = value || placeholder

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
          {label}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="size-4 shrink-0 text-[rgba(211,211,211,0.5)]" />
        </motion.div>
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen ? (
            <motion.div
              id={menuId}
              role="listbox"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: menuPos.top,
                left: menuPos.left,
                width: menuPos.width,
                zIndex: 80,
              }}
              className="overflow-hidden rounded-[8px] border border-white/10 bg-[#1a1a1a]"
            >
              {options.map((option, index) => {
                const selected = value === option
                return (
                  <motion.button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    onClick={() => {
                      onChange(option)
                      setIsOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[16px] font-normal text-[#cccccc] transition-colors duration-200 hover:bg-white/5 ${
                      index !== options.length - 1 ? 'border-b border-white/10' : ''
                    }`}
                  >
                    <span>{option}</span>
                    {selected ? (
                      <motion.div
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
