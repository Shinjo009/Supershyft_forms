import { useEffect, useMemo, useState } from 'react'
import {
  LIFESTYLE_HABITS_INFO_BY_QUESTION,
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
import { LifestyleHabitsQuestionHeader } from './lifestyle-habits/LifestyleHabitsQuestionHeader'
import { MCQ_QUESTION_HINT_CLASS } from './mcq/mcqLayout'
import { McqInfoOverlay } from './mcq/McqInfoOverlay'
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
  const [wellnessPriority, setWellnessPriority] = useState<HealthWellnessPriorityOption | null>(
    null,
  )
  const [lifestyleCommitment, setLifestyleCommitment] = useState<LifestyleCommitmentOption | null>(
    null,
  )
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    setInfoOpen(false)
  }, [questionIndex])

  const handleBack = () => {
    if (infoOpen) {
      setInfoOpen(false)
      return
    }
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

  const lifestyleAnswers = useMemo(
    () => [
      sitDuration,
      physicalActivity,
      weeklyLeisure,
      activityIntensity,
      dailyWalking,
      sleepDuration,
      alcoholConsumption,
      smokingFrequency,
      wellnessPriority,
      lifestyleCommitment,
    ],
    [
      sitDuration,
      physicalActivity,
      weeklyLeisure,
      activityIntensity,
      dailyWalking,
      sleepDuration,
      alcoholConsumption,
      smokingFrequency,
      wellnessPriority,
      lifestyleCommitment,
    ],
  )

  const isCurrentQuestionAnswered = lifestyleAnswers[questionIndex] !== null

  return (
    <LifestyleHabitsMcqShell
      onBack={handleBack}
      onNext={handleNext}
      progressPercent={lifestyleHabitsProgressPercent(
        questionIndex,
        isCurrentQuestionAnswered,
      )}
      isLastQuestion={questionIndex === LIFESTYLE_HABITS_TOTAL_QUESTIONS - 1}
      nextQuestionPreview={
        LIFESTYLE_HABITS_NEXT_PREVIEWS[questionIndex] ?? { line1: '', line2: '' }
      }
    >
      {questionIndex === 0 ? (
        <Question1SitDuration
          selected={sitDuration}
          onSelect={setSitDuration}
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : questionIndex === 1 ? (
        <Question2PhysicalActivity
          selected={physicalActivity}
          onSelect={setPhysicalActivity}
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : questionIndex === 2 ? (
        <Question3WeeklyLeisure
          selected={weeklyLeisure}
          onSelect={setWeeklyLeisure}
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : questionIndex === 3 ? (
        <Question4ActivityIntensity
          selected={activityIntensity}
          onSelect={setActivityIntensity}
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : questionIndex === 4 ? (
        <Question5DailyWalking
          selected={dailyWalking}
          onSelect={setDailyWalking}
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : questionIndex === 5 ? (
        <Question6SleepDuration
          selected={sleepDuration}
          onSelect={setSleepDuration}
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : questionIndex === 6 ? (
        <Question7AlcoholConsumption
          selected={alcoholConsumption}
          onSelect={setAlcoholConsumption}
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : questionIndex === 7 ? (
        <Question8SmokingFrequency
          selected={smokingFrequency}
          onSelect={setSmokingFrequency}
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : questionIndex === 8 ? (
        <Question9HealthWellnessPriorities
          selected={wellnessPriority}
          onSelect={setWellnessPriority}
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : questionIndex === 9 ? (
        <Question10LifestyleCommitment
          selected={lifestyleCommitment}
          onSelect={setLifestyleCommitment}
          onInfoClick={() => setInfoOpen(true)}
        />
      ) : null}

      <McqInfoOverlay
        open={infoOpen}
        items={LIFESTYLE_HABITS_INFO_BY_QUESTION[questionIndex] ?? []}
        theme="lifestyle"
        onClose={() => setInfoOpen(false)}
      />
    </LifestyleHabitsMcqShell>
  )
}

/** Figma 5629:14280 — radial dial sit duration */
function Question1SitDuration({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: SitDurationOption | null
  onSelect: (value: SitDurationOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-16">
      <LifestyleHabitsQuestionHeader
        onInfoClick={onInfoClick}
        questionLabel={`Question 1 of ${LIFESTYLE_HABITS_TOTAL_QUESTIONS}`}
      >
        <p>How long do you sit continuously every day due to work or lifestyle?</p>
      </LifestyleHabitsQuestionHeader>

      <SitDurationDial selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5629:14346 — radial dial physical activity */
function Question2PhysicalActivity({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: PhysicalActivityOption | null
  onSelect: (value: PhysicalActivityOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-16">
      <LifestyleHabitsQuestionHeader
        onInfoClick={onInfoClick}
        questionLabel={`Question 2 of ${LIFESTYLE_HABITS_TOTAL_QUESTIONS}`}
      >
        <p>How much time do you spend engaging in physical activity or exercise daily?</p>
        <p className={MCQ_QUESTION_HINT_CLASS}>
          (brisk walking or bicycling or heavy lifting or games or yoga or meditation or
          cleaning)
        </p>
      </LifestyleHabitsQuestionHeader>

      <PhysicalActivityDial selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5629:14444 — radial dial weekly leisure */
function Question3WeeklyLeisure({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: WeeklyLeisureOption | null
  onSelect: (value: WeeklyLeisureOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-16">
      <LifestyleHabitsQuestionHeader
        onInfoClick={onInfoClick}
        questionLabel={`Question 3 of ${LIFESTYLE_HABITS_TOTAL_QUESTIONS}`}
      >
        <p>
          On a typical week, how much time do you dedicate to leisure activities, workouts or
          sports?
        </p>
      </LifestyleHabitsQuestionHeader>

      <WeeklyLeisureDial selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5629:14531 — pulse bar activity intensity */
function Question4ActivityIntensity({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: ActivityIntensityOption | null
  onSelect: (value: ActivityIntensityOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader
        onInfoClick={onInfoClick}
        questionLabel={`Question 4 of ${LIFESTYLE_HABITS_TOTAL_QUESTIONS}`}
      >
        <p>On an average week, how would you</p>
        <p>rate the intensity of your activities or workouts?</p>
      </LifestyleHabitsQuestionHeader>

      <ActivityIntensityMeter selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5629:14630 — radial dial daily walking */
function Question5DailyWalking({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: DailyWalkingOption | null
  onSelect: (value: DailyWalkingOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader
        onInfoClick={onInfoClick}
        questionLabel={`Question 5 of ${LIFESTYLE_HABITS_TOTAL_QUESTIONS}`}
      >
        <p>How much time do you spend actively walking each day?</p>
        <p className={MCQ_QUESTION_HINT_CLASS}>
          (Includes commuting to work, breaks at work and household chores)
        </p>
      </LifestyleHabitsQuestionHeader>

      <DailyWalkingDial selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5629:14731 — sleep duration crescent meter */
function Question6SleepDuration({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: SleepDurationOption | null
  onSelect: (value: SleepDurationOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader
        onInfoClick={onInfoClick}
        questionLabel={`Question 6 of ${LIFESTYLE_HABITS_TOTAL_QUESTIONS}`}
      >
        <p>What is your average duration of good-quality sleep?</p>
      </LifestyleHabitsQuestionHeader>

      <SleepDurationMeter selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5629:14830 — alcohol consumption pills */
function Question7AlcoholConsumption({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: AlcoholConsumptionOption | null
  onSelect: (value: AlcoholConsumptionOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader
        onInfoClick={onInfoClick}
        questionLabel={`Question 7 of ${LIFESTYLE_HABITS_TOTAL_QUESTIONS}`}
      >
        <p>What is your alcohol consumption?</p>
        <p className={MCQ_QUESTION_HINT_CLASS}>
          (1 serving = 125 ml wine or 330 ml of beer or 40 ml of hard liquor)
        </p>
      </LifestyleHabitsQuestionHeader>

      <AlcoholConsumptionOptions selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5657:50916 — smoking frequency pill grid */
function Question8SmokingFrequency({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: SmokingFrequencyOption | null
  onSelect: (value: SmokingFrequencyOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader
        onInfoClick={onInfoClick}
        questionLabel={`Question 8 of ${LIFESTYLE_HABITS_TOTAL_QUESTIONS}`}
      >
        <p>How often do you smoke cigarettes or tobacco?</p>
      </LifestyleHabitsQuestionHeader>

      <SmokingFrequencyOptions selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5657:51001 — health & wellness priorities (single-select) */
function Question9HealthWellnessPriorities({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: HealthWellnessPriorityOption | null
  onSelect: (value: HealthWellnessPriorityOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader
        onInfoClick={onInfoClick}
        questionLabel={`Question 9 of ${LIFESTYLE_HABITS_TOTAL_QUESTIONS}`}
      >
        <p>What are your primary health and wellness priorities?</p>
      </LifestyleHabitsQuestionHeader>

      <HealthWellnessPrioritiesOptions selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5657:51084 — lifestyle commitment pills */
function Question10LifestyleCommitment({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: LifestyleCommitmentOption | null
  onSelect: (value: LifestyleCommitmentOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader
        onInfoClick={onInfoClick}
        questionLabel={`Question 10 of ${LIFESTYLE_HABITS_TOTAL_QUESTIONS}`}
      >
        <p>How often do you smoke cigarettes or tobacco?</p>
      </LifestyleHabitsQuestionHeader>

      <LifestyleCommitmentOptions selected={selected} onSelect={onSelect} />
    </div>
  )
}
