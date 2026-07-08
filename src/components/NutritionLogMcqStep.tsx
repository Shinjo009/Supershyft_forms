import { useState } from 'react'
import infoIcon from '../assets/nutrition-log/info-icon.svg'
import {
  NUTRITION_LOG_NEXT_PREVIEWS,
  NUTRITION_LOG_TOTAL_QUESTIONS,
  nutritionLogProgressPercent,
  type BreakfastFrequencyOption,
  type BakedGoodsFrequencyOption,
  type ConsumptionFrequencyOption,
  type DailyFoodGroupOption,
  type DietTypeOption,
} from '../data/nutritionLogQuestions'
import { BreakfastFrequencySelector } from './nutrition-log/BreakfastFrequencySelector'
import { BakedGoodsFrequencySelector } from './nutrition-log/BakedGoodsFrequencySelector'
import { DailyFoodGroupsOptions } from './nutrition-log/DailyFoodGroupsOptions'
import { DietTypeOptions } from './nutrition-log/DietTypeOptions'
import { FreshFruitsFrequencySelector } from './nutrition-log/FreshFruitsFrequencySelector'
import { FreshVegetablesFrequencySelector } from './nutrition-log/FreshVegetablesFrequencySelector'
import { NutritionLogMcqShell } from './nutrition-log/NutritionLogMcqShell'

/** Nutrition Log MCQ flow — Figma 5627:12757 */
export function NutritionLogMcqStep({
  onBack,
}: {
  onBack?: () => void
}) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [dietType, setDietType] = useState<DietTypeOption | null>(null)
  const [dailyFoodGroups, setDailyFoodGroups] = useState<DailyFoodGroupOption[]>([])
  const [breakfastFrequency, setBreakfastFrequency] = useState<BreakfastFrequencyOption | null>(
    null,
  )
  const [freshFruitsFrequency, setFreshFruitsFrequency] =
    useState<ConsumptionFrequencyOption | null>(null)
  const [freshVegetablesFrequency, setFreshVegetablesFrequency] =
    useState<ConsumptionFrequencyOption | null>(null)
  const [bakedGoodsFrequency, setBakedGoodsFrequency] =
    useState<BakedGoodsFrequencyOption | null>(null)

  const handleBack = () => {
    if (questionIndex > 0) {
      setQuestionIndex((index) => index - 1)
      return
    }
    onBack?.()
  }

  const handleNext = () => {
    if (questionIndex < NUTRITION_LOG_TOTAL_QUESTIONS - 1) {
      setQuestionIndex((index) => index + 1)
    }
  }

  const toggleDailyFoodGroup = (value: DailyFoodGroupOption) => {
    setDailyFoodGroups((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    )
  }

  return (
    <NutritionLogMcqShell
      onBack={handleBack}
      onNext={handleNext}
      progressPercent={nutritionLogProgressPercent(questionIndex)}
      nextQuestionPreview={
        NUTRITION_LOG_NEXT_PREVIEWS[questionIndex] ?? { line1: '', line2: '' }
      }
    >
      {questionIndex === 0 ? (
        <Question1DietType selected={dietType} onSelect={setDietType} />
      ) : null}
      {questionIndex === 1 ? (
        <Question2DailyFoodGroups
          selected={dailyFoodGroups}
          onToggle={toggleDailyFoodGroup}
        />
      ) : null}
      {questionIndex === 2 ? (
        <Question3BreakfastFrequency
          selected={breakfastFrequency}
          onSelect={setBreakfastFrequency}
        />
      ) : null}
      {questionIndex === 3 ? (
        <Question4FreshFruitsFrequency
          selected={freshFruitsFrequency}
          onSelect={setFreshFruitsFrequency}
        />
      ) : null}
      {questionIndex === 4 ? (
        <Question5FreshVegetablesFrequency
          selected={freshVegetablesFrequency}
          onSelect={setFreshVegetablesFrequency}
        />
      ) : null}
      {questionIndex === 5 ? (
        <Question6BakedGoodsFrequency
          selected={bakedGoodsFrequency}
          onSelect={setBakedGoodsFrequency}
        />
      ) : null}
    </NutritionLogMcqShell>
  )
}

/** Figma 5627:12757 — primary diet type */
function Question1DietType({
  selected,
  onSelect,
}: {
  selected: DietTypeOption | null
  onSelect: (value: DietTypeOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-8">
      <div className="relative w-full">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 1 of {NUTRITION_LOG_TOTAL_QUESTIONS}
        </p>
        <p className="mt-2 text-[16px] leading-normal tracking-[0.08px] text-white">
          What type of diet do you primarily consume?
        </p>
        <img
          src={infoIcon}
          alt=""
          className="absolute left-[307px] top-[3px] size-[14px]"
          aria-hidden
        />
      </div>

      <DietTypeOptions selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5654:8650 — daily food groups (multi-select) */
function Question2DailyFoodGroups({
  selected,
  onToggle,
}: {
  selected: DailyFoodGroupOption[]
  onToggle: (value: DailyFoodGroupOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-8">
      <div className="relative w-full">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 2 of {NUTRITION_LOG_TOTAL_QUESTIONS}
        </p>
        <div className="mt-2 text-[16px] leading-normal tracking-[0.08px] text-white">
          <p>Which of the following food groups do you consume every day?</p>
          <p className="text-[12px] text-[#bbb]">(Select all that apply)</p>
        </div>
        <img
          src={infoIcon}
          alt=""
          className="absolute left-[307px] top-[3px] size-[14px]"
          aria-hidden
        />
      </div>

      <DailyFoodGroupsOptions selected={selected} onToggle={onToggle} />
    </div>
  )
}

/** Figma 5646:36035 — healthy homemade breakfast frequency */
function Question3BreakfastFrequency({
  selected,
  onSelect,
}: {
  selected: BreakfastFrequencyOption | null
  onSelect: (value: BreakfastFrequencyOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-8">
      <div className="relative w-full">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 3 of {NUTRITION_LOG_TOTAL_QUESTIONS}
        </p>
        <p className="mt-2 text-[16px] leading-normal tracking-[0.08px] text-white">
          How frequently do you have a healthy homemade breakfast in a week?
        </p>
      </div>

      <BreakfastFrequencySelector selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5701:15836 — fresh fruits consumption frequency */
function Question4FreshFruitsFrequency({
  selected,
  onSelect,
}: {
  selected: ConsumptionFrequencyOption | null
  onSelect: (value: ConsumptionFrequencyOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-6">
      <div className="relative w-full">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 4 of {NUTRITION_LOG_TOTAL_QUESTIONS}
        </p>
        <p className="mt-2 text-[16px] leading-normal tracking-[0.08px] text-white">
          How frequently do you consume fresh fruits ?
        </p>
      </div>

      <FreshFruitsFrequencySelector selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5722:9811 — fresh vegetables consumption frequency */
function Question5FreshVegetablesFrequency({
  selected,
  onSelect,
}: {
  selected: ConsumptionFrequencyOption | null
  onSelect: (value: ConsumptionFrequencyOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-6">
      <div className="relative w-full">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 5 of {NUTRITION_LOG_TOTAL_QUESTIONS}
        </p>
        <p className="mt-2 text-[16px] leading-normal tracking-[0.08px] text-white">
          How frequently do you consume fresh vegeatables ?
        </p>
      </div>

      <FreshVegetablesFrequencySelector selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5722:10286 — cookies, biscuits, bread, or cakes frequency */
function Question6BakedGoodsFrequency({
  selected,
  onSelect,
}: {
  selected: BakedGoodsFrequencyOption | null
  onSelect: (value: BakedGoodsFrequencyOption) => void
}) {
  return (
    <div className="flex w-[326px] flex-col gap-6">
      <div className="relative w-full">
        <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
          Question 6 of {NUTRITION_LOG_TOTAL_QUESTIONS}
        </p>
        <p className="mt-2 text-[16px] leading-normal tracking-[0.08px] text-white">
          How frequently do you consume cookies, biscuits, bread, or cakes?
        </p>
      </div>

      <BakedGoodsFrequencySelector selected={selected} onSelect={onSelect} />
    </div>
  )
}
