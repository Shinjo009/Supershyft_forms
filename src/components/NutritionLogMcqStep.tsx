import { useEffect, useMemo, useState } from 'react'
import {
  NUTRITION_LOG_INFO_BY_QUESTION,
  NUTRITION_LOG_LAST_STEP_INDEX,
  NUTRITION_LOG_NEXT_PREVIEWS,
  NUTRITION_LOG_TOTAL_QUESTIONS,
  nutritionLogProgressPercent,
  type BreakfastFrequencyOption,
  type BakedGoodsFrequencyOption,
  type CoffeeTeaIntakeOption,
  type CoffeeTeaTypeOption,
  type ConsumptionFrequencyOption,
  type DailyFoodGroupOption,
  type DietTypeOption,
  type ExtraSaltFrequencyOption,
  type IodizedSaltOption,
  type IllnessFrequencyOption,
  type WaterIntakeOption,
} from '../data/nutritionLogQuestions'
import { filterFoodGroupItemsByDiet } from '../lib/filterFoodGroupsByDiet'
import { BreakfastFrequencySelector } from './nutrition-log/BreakfastFrequencySelector'
import { BakedGoodsFrequencySelector } from './nutrition-log/BakedGoodsFrequencySelector'
import { ExtraSaltFrequencyOptions } from './nutrition-log/ExtraSaltFrequencyOptions'
import { IodizedSaltOptions } from './nutrition-log/IodizedSaltOptions'
import { CoffeeTeaIntakeOptions } from './nutrition-log/CoffeeTeaIntakeOptions'
import { CoffeeTeaTypeOptions } from './nutrition-log/CoffeeTeaTypeOptions'
import { MarketButterFrequencySelector } from './nutrition-log/MarketButterFrequencySelector'
import { RedMeatFrequencySelector } from './nutrition-log/RedMeatFrequencySelector'
import { IllnessFrequencySelector } from './nutrition-log/IllnessFrequencySelector'
import { WaterIntakeSelector } from './nutrition-log/WaterIntakeSelector'
import { SugaryDrinksFrequencySelector } from './nutrition-log/SugaryDrinksFrequencySelector'
import { DailyFoodGroupsOptions } from './nutrition-log/DailyFoodGroupsOptions'
import { DietTypeOptions } from './nutrition-log/DietTypeOptions'
import { FreshFruitsFrequencySelector } from './nutrition-log/FreshFruitsFrequencySelector'
import { FreshVegetablesFrequencySelector } from './nutrition-log/FreshVegetablesFrequencySelector'
import { McqQuestionHeader } from './mcq/McqQuestionHeader'
import { MCQ_QUESTION_HINT_CLASS } from './mcq/mcqLayout'
import { McqInfoOverlay } from './mcq/McqInfoOverlay'
import { NutritionLogMcqShell } from './nutrition-log/NutritionLogMcqShell'

/** Nutrition Log MCQ flow — Figma 5627:12757 */
export function NutritionLogMcqStep({
  onBack,
  onComplete,
}: {
  onBack?: () => void
  onComplete?: () => void
}) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [dietType, setDietType] = useState<DietTypeOption | null>(null)
  const [dailyFoodGroups, setDailyFoodGroups] = useState<DailyFoodGroupOption[]>([])
  const [breakfastFrequency, setBreakfastFrequency] = useState<BreakfastFrequencyOption | null>(
    null,
  )

  // When diet type changes, drop food-group selections that are no longer allowed.
  useEffect(() => {
    setDailyFoodGroups((current) => {
      const next = current.filter(
        (id) => filterFoodGroupItemsByDiet([{ id, label: id }], dietType).length > 0,
      )
      return next.length === current.length ? current : next
    })
  }, [dietType])
  const [freshFruitsFrequency, setFreshFruitsFrequency] =
    useState<ConsumptionFrequencyOption | null>(null)
  const [freshVegetablesFrequency, setFreshVegetablesFrequency] =
    useState<ConsumptionFrequencyOption | null>(null)
  const [bakedGoodsFrequency, setBakedGoodsFrequency] =
    useState<BakedGoodsFrequencyOption | null>(null)
  const [sugaryDrinksFrequency, setSugaryDrinksFrequency] =
    useState<BakedGoodsFrequencyOption | null>(null)
  const [iodizedSalt, setIodizedSalt] = useState<IodizedSaltOption | null>(null)
  const [extraSaltFrequency, setExtraSaltFrequency] =
    useState<ExtraSaltFrequencyOption | null>(null)
  const [coffeeTeaIntake, setCoffeeTeaIntake] = useState<CoffeeTeaIntakeOption | null>(null)
  const [coffeeTeaTypes, setCoffeeTeaTypes] = useState<CoffeeTeaTypeOption[]>([])
  const [marketButterFrequency, setMarketButterFrequency] =
    useState<BakedGoodsFrequencyOption | null>(null)
  const [redMeatFrequency, setRedMeatFrequency] =
    useState<BakedGoodsFrequencyOption | null>(null)
  const [waterIntake, setWaterIntake] = useState<WaterIntakeOption | null>(null)
  const [illnessFrequency, setIllnessFrequency] = useState<IllnessFrequencyOption | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [infoQuestionIndex, setInfoQuestionIndex] = useState(0)

  useEffect(() => {
    setInfoOpen(false)
  }, [questionIndex])

  const openInfo = (questionNumberIndex: number) => {
    setInfoQuestionIndex(questionNumberIndex)
    setInfoOpen(true)
  }

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
    if (questionIndex < NUTRITION_LOG_LAST_STEP_INDEX) {
      setQuestionIndex((index) => index + 1)
      return
    }
    onComplete?.()
  }

  const toggleDailyFoodGroup = (value: DailyFoodGroupOption) => {
    setDailyFoodGroups((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    )
  }

  const toggleCoffeeTeaType = (value: CoffeeTeaTypeOption) => {
    setCoffeeTeaTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    )
  }

  const isCurrentQuestionAnswered = useMemo(() => {
    switch (questionIndex) {
      case 0:
        return dietType !== null
      case 1:
        return dailyFoodGroups.length > 0
      case 2:
        return breakfastFrequency !== null
      case 3:
        return freshFruitsFrequency !== null
      case 4:
        return freshVegetablesFrequency !== null
      case 5:
        return bakedGoodsFrequency !== null
      case 6:
        return sugaryDrinksFrequency !== null
      case 7:
        return iodizedSalt !== null || extraSaltFrequency !== null
      case 8:
        return coffeeTeaIntake !== null
      case 9:
        return coffeeTeaTypes.length > 0
      case 10:
        return marketButterFrequency !== null
      case 11:
        return redMeatFrequency !== null
      case 12:
        return waterIntake !== null
      case 13:
        return illnessFrequency !== null
      default:
        return false
    }
  }, [
    questionIndex,
    dietType,
    dailyFoodGroups,
    breakfastFrequency,
    freshFruitsFrequency,
    freshVegetablesFrequency,
    bakedGoodsFrequency,
    sugaryDrinksFrequency,
    iodizedSalt,
    extraSaltFrequency,
    coffeeTeaIntake,
    coffeeTeaTypes,
    marketButterFrequency,
    redMeatFrequency,
    waterIntake,
    illnessFrequency,
  ])

  return (
    <NutritionLogMcqShell
      onBack={handleBack}
      onNext={handleNext}
      progressPercent={nutritionLogProgressPercent(questionIndex, isCurrentQuestionAnswered)}
      isLastQuestion={questionIndex === NUTRITION_LOG_LAST_STEP_INDEX}
      nextQuestionPreview={
        NUTRITION_LOG_NEXT_PREVIEWS[questionIndex] ?? { line1: '', line2: '' }
      }
    >
      {questionIndex === 0 ? (
        <Question1DietType
          selected={dietType}
          onSelect={setDietType}
          onInfoClick={() => openInfo(0)}
        />
      ) : null}
      {questionIndex === 1 ? (
        <Question2DailyFoodGroups
          selected={dailyFoodGroups}
          dietType={dietType}
          onToggle={toggleDailyFoodGroup}
          onInfoClick={() => openInfo(1)}
        />
      ) : null}
      {questionIndex === 2 ? (
        <Question3BreakfastFrequency
          selected={breakfastFrequency}
          onSelect={setBreakfastFrequency}
          onInfoClick={() => openInfo(2)}
        />
      ) : null}
      {questionIndex === 3 ? (
        <Question4FreshFruitsFrequency
          selected={freshFruitsFrequency}
          onSelect={setFreshFruitsFrequency}
          onInfoClick={() => openInfo(3)}
        />
      ) : null}
      {questionIndex === 4 ? (
        <Question5FreshVegetablesFrequency
          selected={freshVegetablesFrequency}
          onSelect={setFreshVegetablesFrequency}
          onInfoClick={() => openInfo(4)}
        />
      ) : null}
      {questionIndex === 5 ? (
        <Question6BakedGoodsFrequency
          selected={bakedGoodsFrequency}
          onSelect={setBakedGoodsFrequency}
          onInfoClick={() => openInfo(5)}
        />
      ) : null}
      {questionIndex === 6 ? (
        <Question7SugaryDrinksFrequency
          selected={sugaryDrinksFrequency}
          onSelect={setSugaryDrinksFrequency}
          onInfoClick={() => openInfo(6)}
        />
      ) : null}
      {questionIndex === 7 ? (
        <Question8And9SaltDiet
          iodizedSalt={iodizedSalt}
          extraSaltFrequency={extraSaltFrequency}
          onIodizedSaltSelect={setIodizedSalt}
          onExtraSaltSelect={setExtraSaltFrequency}
          onInfoClickQ8={() => openInfo(7)}
          onInfoClickQ9={() => openInfo(8)}
        />
      ) : null}
      {questionIndex === 8 ? (
        <Question10CoffeeTeaIntake
          selected={coffeeTeaIntake}
          onSelect={setCoffeeTeaIntake}
          onInfoClick={() => openInfo(9)}
        />
      ) : null}
      {questionIndex === 9 ? (
        <Question11CoffeeTeaType
          selected={coffeeTeaTypes}
          onToggle={toggleCoffeeTeaType}
          onInfoClick={() => openInfo(10)}
        />
      ) : null}
      {questionIndex === 10 ? (
        <Question12MarketButterFrequency
          selected={marketButterFrequency}
          onSelect={setMarketButterFrequency}
          onInfoClick={() => openInfo(11)}
        />
      ) : null}
      {questionIndex === 11 ? (
        <Question13RedMeatFrequency
          selected={redMeatFrequency}
          onSelect={setRedMeatFrequency}
          onInfoClick={() => openInfo(12)}
        />
      ) : null}
      {questionIndex === 12 ? (
        <Question14WaterIntake
          selected={waterIntake}
          onSelect={setWaterIntake}
          onInfoClick={() => openInfo(13)}
        />
      ) : null}
      {questionIndex === 13 ? (
        <Question15IllnessFrequency
          selected={illnessFrequency}
          onSelect={setIllnessFrequency}
          onInfoClick={() => openInfo(14)}
        />
      ) : null}

      <McqInfoOverlay
        open={infoOpen}
        items={NUTRITION_LOG_INFO_BY_QUESTION[infoQuestionIndex] ?? []}
        theme="nutrition"
        onClose={() => setInfoOpen(false)}
      />
    </NutritionLogMcqShell>
  )
}

/** Figma 5627:12757 — primary diet type */
function Question1DietType({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: DietTypeOption | null
  onSelect: (value: DietTypeOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={`Question 1 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>What type of diet do you primarily consume?</p>
      </McqQuestionHeader>

      <DietTypeOptions selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5654:8650 — daily food groups (multi-select) */
function Question2DailyFoodGroups({
  selected,
  dietType,
  onToggle,
  onInfoClick,
}: {
  selected: DailyFoodGroupOption[]
  dietType: DietTypeOption | null
  onToggle: (value: DailyFoodGroupOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={`Question 2 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>Which of the following food groups do you consume every day?</p>
        <p className={MCQ_QUESTION_HINT_CLASS}>(Select all that apply)</p>
      </McqQuestionHeader>

      <DailyFoodGroupsOptions selected={selected} dietType={dietType} onToggle={onToggle} />
    </div>
  )
}

/** Figma 5646:36035 — healthy homemade breakfast frequency */
function Question3BreakfastFrequency({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: BreakfastFrequencyOption | null
  onSelect: (value: BreakfastFrequencyOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={`Question 3 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>How frequently do you have a healthy homemade breakfast in a week?</p>
      </McqQuestionHeader>

      <BreakfastFrequencySelector selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5701:15836 — fresh fruits consumption frequency */
function Question4FreshFruitsFrequency({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: ConsumptionFrequencyOption | null
  onSelect: (value: ConsumptionFrequencyOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={`Question 4 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>How frequently do you consume fresh fruits ?</p>
      </McqQuestionHeader>

      <FreshFruitsFrequencySelector selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5722:9811 — fresh vegetables consumption frequency */
function Question5FreshVegetablesFrequency({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: ConsumptionFrequencyOption | null
  onSelect: (value: ConsumptionFrequencyOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={`Question 5 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>How frequently do you consume fresh vegeatables ?</p>
      </McqQuestionHeader>

      <FreshVegetablesFrequencySelector selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5722:10286 — cookies, biscuits, bread, or cakes frequency */
function Question6BakedGoodsFrequency({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: BakedGoodsFrequencyOption | null
  onSelect: (value: BakedGoodsFrequencyOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={`Question 6 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>How frequently do you consume cookies, biscuits, bread, or cakes?</p>
      </McqQuestionHeader>

      <BakedGoodsFrequencySelector selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5722:13773 — sugary drinks and desserts consumption frequency */
function Question7SugaryDrinksFrequency({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: BakedGoodsFrequencyOption | null
  onSelect: (value: BakedGoodsFrequencyOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={`Question 7 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>How frequently do you consume sugary drinks and desserts?</p>
        <p className={MCQ_QUESTION_HINT_CLASS}>
          (soft drinks, ice cream, chocolate, cakes or sweets)
        </p>
      </McqQuestionHeader>

      <SugaryDrinksFrequencySelector selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5627:13092 — iodized salt (Q8) + extra salt frequency (Q9) */
function Question8And9SaltDiet({
  iodizedSalt,
  extraSaltFrequency,
  onIodizedSaltSelect,
  onExtraSaltSelect,
  onInfoClickQ8,
  onInfoClickQ9,
}: {
  iodizedSalt: IodizedSaltOption | null
  extraSaltFrequency: ExtraSaltFrequencyOption | null
  onIodizedSaltSelect: (value: IodizedSaltOption) => void
  onExtraSaltSelect: (value: ExtraSaltFrequencyOption) => void
  onInfoClickQ8: () => void
  onInfoClickQ9: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-12">
      <div className="flex flex-col gap-8">
        <McqQuestionHeader
          theme="nutrition"
          questionLabel={`Question 8 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
          onInfoClick={onInfoClickQ8}
        >
          <p>Do you use iodized salt in your diet?</p>
        </McqQuestionHeader>

        <IodizedSaltOptions selected={iodizedSalt} onSelect={onIodizedSaltSelect} />
      </div>

      <div className="flex flex-col gap-8">
        <McqQuestionHeader
          theme="nutrition"
          questionLabel={`Question 9 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
          onInfoClick={onInfoClickQ9}
        >
          <p>How often do you add extra salt to your food?</p>
        </McqQuestionHeader>

        <ExtraSaltFrequencyOptions
          selected={extraSaltFrequency}
          onSelect={onExtraSaltSelect}
        />
      </div>
    </div>
  )
}

/** Figma 5657:46865 — coffee or tea intake */
function Question10CoffeeTeaIntake({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: CoffeeTeaIntakeOption | null
  onSelect: (value: CoffeeTeaIntakeOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={`Question 10 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>What&apos;s your coffee or tea intake?</p>
      </McqQuestionHeader>

      <CoffeeTeaIntakeOptions selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5657:47231 — coffee or tea type (multi-select) */
function Question11CoffeeTeaType({
  selected,
  onToggle,
  onInfoClick,
}: {
  selected: CoffeeTeaTypeOption[]
  onToggle: (value: CoffeeTeaTypeOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={`Question 11 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>What type of coffee or tea do you drink?</p>
        <p className={MCQ_QUESTION_HINT_CLASS}>(Select all that apply)</p>
      </McqQuestionHeader>

      <CoffeeTeaTypeOptions selected={selected} onToggle={onToggle} />
    </div>
  )
}

/** Figma 5657:47328 — market butter dish frequency */
function Question12MarketButterFrequency({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: BakedGoodsFrequencyOption | null
  onSelect: (value: BakedGoodsFrequencyOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={`Question 12 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>How frequently do you indulge in dishes that are rich in market butter?</p>
      </McqQuestionHeader>

      <MarketButterFrequencySelector selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5657:50832 — red meat consumption frequency */
function Question13RedMeatFrequency({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: BakedGoodsFrequencyOption | null
  onSelect: (value: BakedGoodsFrequencyOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={`Question 13 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>How frequently do you consume red meat (i.e., mutton, lamb, beef, pork)?</p>
      </McqQuestionHeader>

      <RedMeatFrequencySelector selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5627:13237 — daily water intake with animated bottle */
function Question14WaterIntake({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: WaterIntakeOption | null
  onSelect: (value: WaterIntakeOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={`Question 14 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>How many glasses of water do you drink in a day?</p>
        <p className={MCQ_QUESTION_HINT_CLASS}>(1 glass of water is ~250 ml)</p>
      </McqQuestionHeader>

      <WaterIntakeSelector selected={selected} onSelect={onSelect} />
    </div>
  )
}

/** Figma 5627:13346 — annual illness frequency with circular meter */
function Question15IllnessFrequency({
  selected,
  onSelect,
  onInfoClick,
}: {
  selected: IllnessFrequencyOption | null
  onSelect: (value: IllnessFrequencyOption) => void
  onInfoClick: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={`Question 15 of ${NUTRITION_LOG_TOTAL_QUESTIONS}`}
        onInfoClick={onInfoClick}
      >
        <p>How often do you fall sick in a year?</p>
        <p className={MCQ_QUESTION_HINT_CLASS}>(Required at least a day of bed rest)</p>
      </McqQuestionHeader>

      <IllnessFrequencySelector selected={selected} onSelect={onSelect} />
    </div>
  )
}
