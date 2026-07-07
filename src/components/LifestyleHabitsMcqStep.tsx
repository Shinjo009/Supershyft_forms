import { useState } from 'react'
import {
  LIFESTYLE_HABITS_NEXT_PREVIEWS,
  LIFESTYLE_HABITS_TOTAL_QUESTIONS,
  lifestyleHabitsProgressPercent,
  type PhysicalActivityOption,
  type SitDurationOption,
  type WeeklyLeisureOption,
} from '../data/lifestyleHabitsQuestions'
import { LifestyleHabitsMcqShell } from './lifestyle-habits/LifestyleHabitsMcqShell'
import { PhysicalActivityDial } from './lifestyle-habits/PhysicalActivityDial'
import { SitDurationDial } from './lifestyle-habits/SitDurationDial'
import { WeeklyLeisureDial } from './lifestyle-habits/WeeklyLeisureDial'

/** Lifestyle & Habits MCQ flow — Figma 5629:14250 */
export function LifestyleHabitsMcqStep({
  onBack,
}: {
  onBack?: () => void
}) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [sitDuration, setSitDuration] = useState<SitDurationOption | null>(null)
  const [physicalActivity, setPhysicalActivity] = useState<PhysicalActivityOption | null>(null)
  const [weeklyLeisure, setWeeklyLeisure] = useState<WeeklyLeisureOption | null>(null)

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
      ) : questionIndex === 1 ? (
        <Question2PhysicalActivity
          selected={physicalActivity}
          onSelect={setPhysicalActivity}
        />
      ) : questionIndex === 2 ? (
        <Question3WeeklyLeisure selected={weeklyLeisure} onSelect={setWeeklyLeisure} />
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

/** Figma 5629:14346 — radial dial physical activity */
function Question2PhysicalActivity({
  selected,
  onSelect,
}: {
  selected: PhysicalActivityOption | null
  onSelect: (value: PhysicalActivityOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-16">
      <div className="flex w-full flex-col gap-2">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 2 of {LIFESTYLE_HABITS_TOTAL_QUESTIONS}
        </p>
        <div className="text-[16px] leading-normal tracking-[0.08px] text-white">
          <p>How much time do you spend engaging in physical activity or exercise daily?</p>
          <p className="mt-0 text-[12px] text-[#bbb]">
            (Brisk Walking or Bicycling or Heavy Lifting or Games or Yoga or Meditation or
            Cleaning)
          </p>
        </div>
      </div>

      <PhysicalActivityDial selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5629:14444 — radial dial weekly leisure */
function Question3WeeklyLeisure({
  selected,
  onSelect,
}: {
  selected: WeeklyLeisureOption | null
  onSelect: (value: WeeklyLeisureOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-16">
      <div className="flex w-full flex-col gap-2">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 3 of {LIFESTYLE_HABITS_TOTAL_QUESTIONS}
        </p>
        <p className="text-[16px] leading-normal tracking-[0.08px] text-white">
          On a typical week, how much time do you dedicate to leisure activities, workouts or
          sports?
        </p>
      </div>

      <WeeklyLeisureDial selected={selected} onSelect={onSelect} />
    </div>
  )
}
