import { useState } from 'react'
import {
  LIFESTYLE_HABITS_NEXT_PREVIEWS,
  LIFESTYLE_HABITS_TOTAL_QUESTIONS,
  lifestyleHabitsProgressPercent,
  type SitDurationOption,
} from '../data/lifestyleHabitsQuestions'
import { LifestyleHabitsMcqShell } from './lifestyle-habits/LifestyleHabitsMcqShell'
import { SitDurationDial } from './lifestyle-habits/SitDurationDial'

/** Lifestyle & Habits MCQ flow — Figma 5629:14250 */
export function LifestyleHabitsMcqStep({
  onBack,
}: {
  onBack?: () => void
}) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [sitDuration, setSitDuration] = useState<SitDurationOption | null>(null)

  const handleBack = () => {
    if (questionIndex > 0) {
      setQuestionIndex((index) => index - 1)
      return
    }
    onBack?.()
  }

  const handleNext = () => {
    if (questionIndex < LIFESTYLE_HABITS_TOTAL_QUESTIONS - 1) {
      setQuestionIndex((index) => index + 1)
    }
  }

  return (
    <LifestyleHabitsMcqShell
      onBack={handleBack}
      onNext={handleNext}
      progressPercent={lifestyleHabitsProgressPercent(questionIndex)}
      nextQuestionPreview={
        LIFESTYLE_HABITS_NEXT_PREVIEWS[questionIndex] ?? { line1: '', line2: '' }
      }
    >
      {questionIndex === 0 ? (
        <Question1SitDuration selected={sitDuration} onSelect={setSitDuration} />
      ) : null}
    </LifestyleHabitsMcqShell>
  )
}

/** Figma 5629:14280 — radial dial sit duration */
function Question1SitDuration({
  selected,
  onSelect,
}: {
  selected: SitDurationOption | null
  onSelect: (value: SitDurationOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-16">
      <div className="flex w-full flex-col gap-2">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 1 of {LIFESTYLE_HABITS_TOTAL_QUESTIONS}
        </p>
        <p className="text-[16px] leading-normal tracking-[0.08px] text-white">
          How long do you sit continuously every day due to work or lifestyle?
        </p>
      </div>

      <SitDurationDial selected={selected} onSelect={onSelect} />
    </div>
  )
}
