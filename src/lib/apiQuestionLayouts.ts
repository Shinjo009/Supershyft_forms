import {
  getOptionLabel,
  getOptionValue,
  type QuestionnaireOption,
  type QuestionnaireQuestion,
} from '../api/questionnaire'

/** Detect Family History Q1 — Inland / Coastal location cards. */
export function isFamilyHistoryLocationQuestion(question: QuestionnaireQuestion): boolean {
  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 2) return false

  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  const hasInland = labels.some((label) => label.includes('inland'))
  const hasCoastal = labels.some((label) => label.includes('coastal'))
  if (hasInland && hasCoastal) return true

  const key = String(question.question_key || '').toLowerCase()
  if (key.includes('location') || key.includes('lived') || key.includes('residence')) {
    return hasInland || hasCoastal
  }

  const text = String(question.question_text || '').toLowerCase()
  return text.includes('lived most of your life') && (hasInland || hasCoastal)
}

export function resolveLocationCardKind(
  option: QuestionnaireOption,
): 'inland' | 'coastal' | null {
  const label = getOptionLabel(option).toLowerCase()
  const value = getOptionValue(option).toLowerCase()
  const haystack = `${label} ${value}`
  if (haystack.includes('inland')) return 'inland'
  if (haystack.includes('coastal')) return 'coastal'
  return null
}

/** Detect Lifestyle Q1 — continuous sit duration dial. */
export function isLifestyleSitDurationQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (text.includes('sit continuously') || key.includes('sit_duration') || key.includes('sitting')) {
    return true
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 3) return false
  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  const hasUnder1 = labels.some((label) => label.includes('< 1') || label.includes('under 1') || label.includes('<1'))
  const has1to4 = labels.some((label) => label.includes('1-4') || label.includes('1 – 4') || label.includes('1 to 4'))
  const has4plus = labels.some((label) => label.includes('4h+') || label.includes('4+') || label.includes('more than 4'))
  return hasUnder1 && has1to4 && has4plus
}

/** Detect Lifestyle Q2 — physical activity radial dial. */
export function isLifestylePhysicalActivityQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (
    key.includes('physical_activity') ||
    key.includes('physical-activity') ||
    (text.includes('physical activity') && text.includes('daily'))
  ) {
    return true
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 4) return false
  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  const hasRare = labels.some((label) => label.includes('rare') || label.includes('never'))
  const hasUnder30 = labels.some(
    (label) => label.includes('< 30') || label.includes('less than 30') || label.includes('under 30'),
  )
  const has3060 = labels.some((label) => label.includes('30-60') || label.includes('30 to 60'))
  const has60plus = labels.some(
    (label) => label.includes('60+') || label.includes('more than 60') || label.includes('over 60'),
  )
  return hasRare && hasUnder30 && has3060 && has60plus
}

/** Detect Lifestyle Q3 — weekly leisure radial dial. */
export function isLifestyleWeeklyLeisureQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (
    key.includes('weekly_leisure') ||
    key.includes('weekly-leisure') ||
    (text.includes('leisure') && (text.includes('week') || text.includes('typical')))
  ) {
    return true
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 4) return false
  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  const hasRare = labels.some((label) => label.includes('rare') || label.includes('never'))
  const hasUnder1 = labels.some(
    (label) => label.includes('< 1') || label.includes('less than 1') || label.includes('under 1'),
  )
  const has1to3 = labels.some((label) => label.includes('1-3') || label.includes('1 to 3'))
  const has4to8 = labels.some(
    (label) => label.includes('4-8') || label.includes('4 to 8') || label.includes('more than 8'),
  )
  return hasRare && hasUnder1 && has1to3 && has4to8
}

/** Detect Lifestyle Q5 — daily walking radial dial. */
export function isLifestyleDailyWalkingQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (
    key.includes('daily_walking') ||
    key.includes('daily-walking') ||
    (text.includes('walking') && text.includes('each day'))
  ) {
    return true
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 5) return false
  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  const hasUnder15 = labels.some(
    (label) => label.includes('< 15') || label.includes('less than 15') || label.includes('under 15'),
  )
  const has1530 = labels.some((label) => label.includes('15-30') || label.includes('15 to 30'))
  const has2plus = labels.some(
    (label) => label.includes('2h+') || label.includes('more than 2') || label.includes('over 2'),
  )
  return hasUnder15 && has1530 && has2plus
}

/** Detect Lifestyle Q4 — activity intensity meter. */
export function isLifestyleActivityIntensityQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (
    key.includes('activity_intensity') ||
    key.includes('activity-intensity') ||
    (text.includes('intensity') && (text.includes('activit') || text.includes('workout')))
  ) {
    return true
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 3) return false
  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  const hasLow = labels.some((label) => label.includes('low') || label.includes('light'))
  const hasModerate = labels.some((label) => label.includes('moderate') || label.includes('medium'))
  const hasHigh = labels.some((label) => label.includes('high') || label.includes('vigorous'))
  return hasLow && hasModerate && hasHigh
}

/** Detect Lifestyle Q6 — sleep duration meter. */
export function isLifestyleSleepDurationQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (
    key.includes('sleep_duration') ||
    key.includes('sleep-duration') ||
    (text.includes('sleep') && (text.includes('duration') || text.includes('average')))
  ) {
    return true
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 4) return false
  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  const hasUnder5 = labels.some(
    (label) => label.includes('<5') || label.includes('< 5') || label.includes('under 5'),
  )
  const has9plus = labels.some(
    (label) => label.includes('9+') || label.includes('9 +') || label.includes('more than 9'),
  )
  return hasUnder5 && has9plus
}

/** Detect Lifestyle Q7 — alcohol consumption pills. */
export function isLifestyleAlcoholConsumptionQuestion(question: QuestionnaireQuestion): boolean {
  // Smoking also has a "quit" option — never treat smoke/tobacco questions as alcohol.
  if (isLifestyleSmokingFrequencyQuestion(question)) return false

  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (
    key.includes('alcohol_consumption') ||
    key.includes('alcohol-consumption') ||
    key.includes('alcohol') ||
    text.includes('alcohol')
  ) {
    return true
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 2) return false
  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  return labels.some(
    (label) =>
      // Coffee/tea also contains "drink", so don't match generic "do not drink" text.
      label.includes('alcohol') ||
      label.includes('serving') ||
      (label.includes('drink') && label.includes('alcohol')),
  )
}

/** Detect Lifestyle Q8 — smoking frequency pills. */
export function isLifestyleSmokingFrequencyQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (
    key.includes('smoking_frequency') ||
    key.includes('smoking-frequency') ||
    key.includes('smoking') ||
    text.includes('smoke') ||
    text.includes('tobacco') ||
    text.includes('cigarette')
  ) {
    return true
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 2) return false
  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  return labels.some(
    (label) => label.includes('smoke') || label.includes('tobacco') || label.includes('cigarette'),
  )
}

/** Detect Lifestyle Q9 — wellness priorities pills. */
export function isLifestyleWellnessPrioritiesQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (
    key.includes('wellness_priorities') ||
    key.includes('wellness-priorities') ||
    key.includes('health_wellness') ||
    (text.includes('wellness') && text.includes('priorit')) ||
    (text.includes('health') && text.includes('priorit'))
  ) {
    return true
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 3) return false
  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  const hasWeight = labels.some((label) => label.includes('weight'))
  const hasMuscle = labels.some((label) => label.includes('muscle'))
  const hasEnergy = labels.some((label) => label.includes('energy'))
  return hasWeight && hasMuscle && hasEnergy
}

/** Detect Lifestyle Q10 — lifestyle commitment pills. */
export function isLifestyleCommitmentQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (
    key.includes('lifestyle_commitment') ||
    key.includes('lifestyle-commitment') ||
    (text.includes('commit') && (text.includes('lifestyle') || text.includes('ready')))
  ) {
    return true
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 3) return false
  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  const hasActivity = labels.some((label) => label.includes('activity') || label.includes('exercise'))
  const hasHabits = labels.some((label) => label.includes('habit'))
  const hasDiet = labels.some((label) => label.includes('diet') || label.includes('intake'))
  return hasActivity && hasHabits && hasDiet
}

/** Detect Nutrition Q1 — primary diet type pills. */
export function isNutritionDietTypeQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (
    text.includes('type of diet') ||
    text.includes('primarily consume') ||
    key.includes('diet_type') ||
    key.includes('diet-type')
  ) {
    return true
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 3) return false
  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  const hasVeg = labels.some((label) => label === 'veg' || label.includes('vegetarian'))
  const hasNonVeg = labels.some((label) => label.includes('non-veg') || label.includes('non veg'))
  return hasVeg && hasNonVeg
}

/** Detect Nutrition Q2 — daily food groups multi-select. */
export function isNutritionDailyFoodGroupsQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  return (
    key.includes('daily_food_groups') ||
    key.includes('food_groups') ||
    (text.includes('food groups') && text.includes('every day'))
  )
}

/** Detect Nutrition Q3 — breakfast frequency meter. */
export function isNutritionBreakfastFrequencyQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  return key.includes('breakfast') || text.includes('breakfast')
}

/** Detect Nutrition consumption-frequency ring questions (fruits, veg, baked, drinks, butter, meat). */
export function isNutritionConsumptionFrequencyQuestion(question: QuestionnaireQuestion): boolean {
  const key = String(question.question_key || '').toLowerCase()
  const text = String(question.question_text || '').toLowerCase()

  if (
    key.includes('fresh_fruits') ||
    key.includes('fresh_vegetables') ||
    key.includes('baked_goods') ||
    key.includes('sugary_drinks') ||
    key.includes('market_butter') ||
    key.includes('red_meat')
  ) {
    return true
  }

  if (text.includes('breakfast') || text.includes('water') || text.includes('illness') || text.includes('sick')) {
    return false
  }

  return (
    (text.includes('frequently') || text.includes('how often') || text.includes('how frequently')) &&
    (text.includes('fruit') ||
      text.includes('vegetable') ||
      text.includes('cookie') ||
      text.includes('biscuit') ||
      text.includes('cake') ||
      text.includes('sugary') ||
      text.includes('butter') ||
      text.includes('margarine') ||
      text.includes('red meat') ||
      text.includes('meat'))
  )
}

/** Detect Nutrition Q8 — iodized salt yes/no. */
export function isNutritionIodizedSaltQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  return key.includes('iodized_salt') || text.includes('iodized salt')
}

/** Detect Nutrition Q9 — extra salt frequency. */
export function isNutritionExtraSaltQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  return (
    key.includes('extra_salt') ||
    (text.includes('extra salt') && (text.includes('add') || text.includes('often')))
  )
}

/** Detect Nutrition Q10 — coffee/tea cups per day. */
export function isNutritionCoffeeTeaIntakeQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (key.includes('coffee_tea_type') || text.includes('type of coffee') || text.includes('type of tea')) {
    return false
  }
  return (
    key.includes('coffee_tea_intake') ||
    ((text.includes('coffee') || text.includes('tea')) &&
      (text.includes('how much') ||
        text.includes('drink in a day') ||
        text.includes('cups') ||
        text.includes('intake')))
  )
}

/** Detect Nutrition Q11 — coffee/tea type multi-select. */
export function isNutritionCoffeeTeaTypeQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  return (
    key.includes('coffee_tea_type') ||
    ((text.includes('coffee') || text.includes('tea')) && text.includes('type'))
  )
}

/** Detect Nutrition Q14 — water intake bottle. */
export function isNutritionWaterIntakeQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  return (
    key.includes('water_intake') ||
    key === 'water' ||
    (text.includes('water') &&
      (text.includes('drink') || text.includes('intake') || text.includes('glass') || text.includes('how much')))
  )
}

/** Detect Nutrition Q15 — illness frequency meter. */
export function isNutritionIllnessFrequencyQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  return (
    key.includes('illness') ||
    text.includes('illness') ||
    text.includes('fall sick') ||
    text.includes('get sick')
  )
}

/** Stable meter id from question key for SVG gradient uniqueness. */
export function nutritionMeterIdForQuestion(question: QuestionnaireQuestion): string {
  const key = String(question.question_key || 'nutrition')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
  return `nutrition-${key || 'meter'}`
}
