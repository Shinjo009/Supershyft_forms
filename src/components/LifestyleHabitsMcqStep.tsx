import { useState } from 'react'
import {
  LIFESTYLE_HABITS_NEXT_PREVIEWS,
  LIFESTYLE_HABITS_TOTAL_QUESTIONS,
  lifestyleHabitsProgressPercent,
  type ActivityIntensityOption,
  type AlcoholConsumptionOption,
  type DailyWalkingOption,
  type HealthWellnessPriorityOption,
  type LifestyleCommitmentOption,
  type PhysicalActivityOption,
  type SitDurationOption,
  type SleepDurationOption,
  type SmokingFrequencyOption,
  type WeeklyLeisureOption,
} from '../data/lifestyleHabitsQuestions'
import { ActivityIntensityMeter } from './lifestyle-habits/ActivityIntensityMeter'
import { AlcoholConsumptionOptions } from './lifestyle-habits/AlcoholConsumptionOptions'
import { DailyWalkingDial } from './lifestyle-habits/DailyWalkingDial'
import { HealthWellnessPrioritiesOptions } from './lifestyle-habits/HealthWellnessPrioritiesOptions'
import { LifestyleCommitmentOptions } from './lifestyle-habits/LifestyleCommitmentOptions'
import { LifestyleHabitsMcqShell } from './lifestyle-habits/LifestyleHabitsMcqShell'
import { PhysicalActivityDial } from './lifestyle-habits/PhysicalActivityDial'
import { SitDurationDial } from './lifestyle-habits/SitDurationDial'
import { SleepDurationMeter } from './lifestyle-habits/SleepDurationMeter'
import { SmokingFrequencyOptions } from './lifestyle-habits/SmokingFrequencyOptions'
import { WeeklyLeisureDial } from './lifestyle-habits/WeeklyLeisureDial'

/** Lifestyle & Habits MCQ flow — Figma 5629:14250 */
export function LifestyleHabitsMcqStep({
  onBack,
  onComplete,
}: {
  onBack?: () => void
  onComplete?: () => void
}) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [sitDuration, setSitDuration] = useState<SitDurationOption | null>(null)
  const [physicalActivity, setPhysicalActivity] = useState<PhysicalActivityOption | null>(null)
  const [weeklyLeisure, setWeeklyLeisure] = useState<WeeklyLeisureOption | null>(null)
  const [activityIntensity, setActivityIntensity] = useState<ActivityIntensityOption | null>(null)
  const [dailyWalking, setDailyWalking] = useState<DailyWalkingOption | null>(null)
  const [sleepDuration, setSleepDuration] = useState<SleepDurationOption | null>(null)
  const [alcoholConsumption, setAlcoholConsumption] = useState<AlcoholConsumptionOption | null>(
    null,
  )
  const [smokingFrequency, setSmokingFrequency] = useState<SmokingFrequencyOption | null>(null)
  const [wellnessPriorities, setWellnessPriorities] = useState<HealthWellnessPriorityOption[]>([])
  const [lifestyleCommitment, setLifestyleCommitment] = useState<LifestyleCommitmentOption | null>(
    null,
  )

  const toggleWellnessPriority = (value: HealthWellnessPriorityOption) => {
    setWellnessPriorities((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : current.length < 2
          ? [...current, value]
          : current,
    )
  }

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
      return
    }
    onComplete?.()
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
      ) : questionIndex === 3 ? (
        <Question4ActivityIntensity
          selected={activityIntensity}
          onSelect={setActivityIntensity}
        />
      ) : questionIndex === 4 ? (
        <Question5DailyWalking selected={dailyWalking} onSelect={setDailyWalking} />
      ) : questionIndex === 5 ? (
        <Question6SleepDuration selected={sleepDuration} onSelect={setSleepDuration} />
      ) : questionIndex === 6 ? (
        <Question7AlcoholConsumption
          selected={alcoholConsumption}
          onSelect={setAlcoholConsumption}
        />
      ) : questionIndex === 7 ? (
        <Question8SmokingFrequency
          selected={smokingFrequency}
          onSelect={setSmokingFrequency}
        />
      ) : questionIndex === 8 ? (
        <Question9HealthWellnessPriorities
          selected={wellnessPriorities}
          onToggle={toggleWellnessPriority}
        />
      ) : questionIndex === 9 ? (
        <Question10LifestyleCommitment
          selected={lifestyleCommitment}
          onSelect={setLifestyleCommitment}
        />
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

/** Figma 5629:14531 — pulse bar activity intensity */
function Question4ActivityIntensity({
  selected,
  onSelect,
}: {
  selected: ActivityIntensityOption | null
  onSelect: (value: ActivityIntensityOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-8">
      <div className="flex w-full flex-col gap-2">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 4 of {LIFESTYLE_HABITS_TOTAL_QUESTIONS}
        </p>
        <div className="text-[16px] leading-normal tracking-[0.08px] text-white">
          <p>On an average week, how would you</p>
          <p>rate the intensity of your activities or workouts?</p>
        </div>
      </div>

      <ActivityIntensityMeter selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5629:14630 — radial dial daily walking */
function Question5DailyWalking({
  selected,
  onSelect,
}: {
  selected: DailyWalkingOption | null
  onSelect: (value: DailyWalkingOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-8">
      <div className="flex w-full flex-col gap-2">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 5 of {LIFESTYLE_HABITS_TOTAL_QUESTIONS}
        </p>
        <div className="text-[16px] leading-normal tracking-[0.08px] text-white">
          <p>How much time do you spend actively walking each day?</p>
          <p className="mt-0 text-[12px] text-[#bbb]">
            (Includes commuting to work, breaks at work and household chores)
          </p>
        </div>
      </div>

      <DailyWalkingDial selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5629:14731 — sleep duration crescent meter */
function Question6SleepDuration({
  selected,
  onSelect,
}: {
  selected: SleepDurationOption | null
  onSelect: (value: SleepDurationOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-8">
      <div className="flex w-full flex-col gap-2">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 6 of {LIFESTYLE_HABITS_TOTAL_QUESTIONS}
        </p>
        <p className="text-[16px] leading-normal tracking-[0.08px] text-white">
          What is your average duration of good-quality sleep?
        </p>
      </div>

      <SleepDurationMeter selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5629:14830 — alcohol consumption pills */
function Question7AlcoholConsumption({
  selected,
  onSelect,
}: {
  selected: AlcoholConsumptionOption | null
  onSelect: (value: AlcoholConsumptionOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-8">
      <div className="flex w-full flex-col gap-2">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 7 of {LIFESTYLE_HABITS_TOTAL_QUESTIONS}
        </p>
        <div className="text-[16px] leading-normal tracking-[0.08px] text-white">
          <p>What is your alcohol consumption?</p>
          <p className="mt-0 text-[12px] text-[#bbb]">
            (1 serving = 125 ml wine or 330 ml of beer or 40 ml of hard liquor)
          </p>
        </div>
      </div>

      <AlcoholConsumptionOptions selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5657:50916 — smoking frequency pill grid */
function Question8SmokingFrequency({
  selected,
  onSelect,
}: {
  selected: SmokingFrequencyOption | null
  onSelect: (value: SmokingFrequencyOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-8">
      <div className="flex w-full flex-col gap-2">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 8 of {LIFESTYLE_HABITS_TOTAL_QUESTIONS}
        </p>
        <p className="text-[16px] leading-normal tracking-[0.08px] text-white">
          How often do you smoke cigarettes or tobacco?
        </p>
      </div>

      <SmokingFrequencyOptions selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5657:51001 — health & wellness priorities (multi-select, max 2) */
function Question9HealthWellnessPriorities({
  selected,
  onToggle,
}: {
  selected: HealthWellnessPriorityOption[]
  onToggle: (value: HealthWellnessPriorityOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-8">
      <div className="flex w-full flex-col gap-2">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 9 of {LIFESTYLE_HABITS_TOTAL_QUESTIONS}
        </p>
        <div className="text-[16px] leading-normal tracking-[0.08px] text-white">
          <p>What are your primary health and wellness priorities?</p>
          <p className="mt-0 text-[12px] text-[#bbb]">(Choose your top two priority)</p>
        </div>
      </div>

      <HealthWellnessPrioritiesOptions selected={selected} onToggle={onToggle} />
    </div>
  )
}

/** Figma 5657:51084 — lifestyle commitment pills */
function Question10LifestyleCommitment({
  selected,
  onSelect,
}: {
  selected: LifestyleCommitmentOption | null
  onSelect: (value: LifestyleCommitmentOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-8">
      <div className="flex w-full flex-col gap-2">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 10 of {LIFESTYLE_HABITS_TOTAL_QUESTIONS}
        </p>
        <p className="text-[16px] leading-normal tracking-[0.08px] text-white">
          How often do you smoke cigarettes or tobacco?
        </p>
      </div>

      <LifestyleCommitmentOptions selected={selected} onSelect={onSelect} />
    </div>
  )
}
