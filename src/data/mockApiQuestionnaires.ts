import type { QuestionnaireQuestion } from '../api/questionnaire'

/**
 * API-shaped mock questionnaires for frontend-only redesign.
 * Designed layouts are mapped one question at a time; the rest stay as generic chips.
 */
export const MOCK_FAMILY_HISTORY_QUESTIONS: QuestionnaireQuestion[] = [
  {
    question_id: 101,
    question_key: 'lived_location',
    question_text: 'Where have you lived most of your life?',
    question_type: 'single_choice',
    is_required: true,
    help_text: null,
    options: [
      {
        option_id: 1,
        option_value: 'inland',
        display_name: 'Inland',
        sort_order: 1,
      },
      {
        option_id: 2,
        option_value: 'coastal',
        display_name: 'Coastal',
        sort_order: 2,
      },
    ],
  },
  {
    question_id: 102,
    question_key: 'relative_conditions',
    question_text:
      'Do any of your close blood relatives (i.e., parents or siblings) have the following health conditions?',
    question_type: 'multi_choice',
    is_required: true,
    help_text: '(Select multiple or none that apply)',
    options: [
      { option_id: 11, option_value: 'type_2_diabetes', display_name: 'Type 2 diabetes' },
      { option_id: 12, option_value: 'fatty_liver', display_name: 'Fatty liver' },
      { option_id: 13, option_value: 'none', display_name: 'None' },
      { option_id: 14, option_value: 'other', display_name: 'Other' },
    ],
  },
  {
    question_id: 103,
    question_key: 'personal_diagnoses',
    question_text: 'Are you diagnosed with the following diseases?',
    question_type: 'multi_choice',
    is_required: true,
    help_text: '(Select multiple or none that apply)',
    options: [
      { option_id: 21, option_value: 'type_2_diabetes', display_name: 'Type 2 diabetes' },
      { option_id: 22, option_value: 'fatty_liver', display_name: 'Fatty liver' },
      { option_id: 23, option_value: 'none', display_name: 'None' },
      { option_id: 24, option_value: 'other', display_name: 'Other' },
    ],
  },
  {
    question_id: 104,
    question_key: 'medications',
    question_text: 'Are you taking medications for the following diseases?',
    question_type: 'multi_choice',
    is_required: true,
    help_text: '(Select multiple or none that apply)',
    options: [
      { option_id: 31, option_value: 'type_2_diabetes', display_name: 'Type 2 diabetes' },
      { option_id: 32, option_value: 'fatty_liver', display_name: 'Fatty liver' },
      { option_id: 33, option_value: 'none', display_name: 'None' },
      { option_id: 34, option_value: 'other', display_name: 'Other' },
    ],
  },
  {
    question_id: 105,
    question_key: 'relative_conditions_other',
    question_text: 'Family health history (other)',
    question_type: 'text',
    is_required: false,
    help_text: null,
    visibility_rules: {
      match: 'all',
      conditions: [
        {
          type: 'question_answer',
          operator: 'contains',
          question_key: 'relative_conditions',
          value: 'other',
        },
      ],
    },
  },
  {
    question_id: 106,
    question_key: 'personal_diagnoses_other',
    question_text: 'Diagnosed diseases (other)',
    question_type: 'text',
    is_required: false,
    help_text: null,
    visibility_rules: {
      match: 'all',
      conditions: [
        {
          type: 'question_answer',
          operator: 'contains',
          question_key: 'personal_diagnoses',
          value: 'other',
        },
      ],
    },
  },
  {
    question_id: 107,
    question_key: 'medications_other',
    question_text: 'Medications (other)',
    question_type: 'text',
    is_required: false,
    help_text: null,
    visibility_rules: {
      match: 'all',
      conditions: [
        {
          type: 'question_answer',
          operator: 'contains',
          question_key: 'medications',
          value: 'other',
        },
      ],
    },
  },
]

export const MOCK_LIFESTYLE_HABITS_QUESTIONS: QuestionnaireQuestion[] = [
  {
    question_id: 201,
    question_key: 'sit_duration',
    question_text: 'How long do you sit continuously every day due to work or lifestyle?',
    question_type: 'single_choice',
    is_required: true,
    help_text: null,
    options: [
      { option_id: 2011, option_value: 'under-1h', display_name: 'Less than 1 hour', sort_order: 1 },
      { option_id: 2012, option_value: '4h-plus', display_name: 'More than 4 hours', sort_order: 2 },
      { option_id: 2013, option_value: '1-4h', display_name: '1-4 hours', sort_order: 3 },
    ],
  },
  {
    question_id: 202,
    question_key: 'physical_activity',
    question_text: 'How much time do you spend engaging in physical activity or exercise daily?',
    question_type: 'single_choice',
    is_required: true,
    help_text:
      '(brisk walking or bicycling or heavy lifting or games or yoga or meditation or cleaning)',
    options: [
      { option_id: 2021, option_value: 'rare', display_name: 'Rarely or never' },
      {
        option_id: 2022,
        option_value: 'under-30-min',
        display_name: 'Less than 30 minutes a day',
      },
      { option_id: 2023, option_value: '30-60m', display_name: '30-60 minutes a day' },
      {
        option_id: 2024,
        option_value: '60-plus',
        display_name: 'More than 60 minutes a day',
      },
    ],
  },
  {
    question_id: 203,
    question_key: 'weekly_leisure',
    question_text:
      'On a typical week, how much time do you dedicate to leisure activities, workouts or sports?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 2031, option_value: 'rarely-never', display_name: 'Rarely or never' },
      { option_id: 2032, option_value: 'under-1h', display_name: 'Less than 1 hour' },
      { option_id: 2033, option_value: '1-3h', display_name: '1 to 3 hours' },
      { option_id: 2034, option_value: '4-8h', display_name: '4 to 8 hours' },
      { option_id: 2035, option_value: '8h-plus', display_name: 'More than 8 hours' },
    ],
  },
  {
    question_id: 204,
    question_key: 'activity_intensity',
    question_text:
      'On an average week, how would you rate the intensity of your activities or workouts?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 2041, option_value: 'low', display_name: 'Low' },
      { option_id: 2042, option_value: 'moderate', display_name: 'Moderate' },
      { option_id: 2043, option_value: 'high', display_name: 'High' },
    ],
  },
  {
    question_id: 205,
    question_key: 'daily_walking',
    question_text: 'How much time do you spend actively walking each day?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 2051, option_value: 'under-15m', display_name: 'Less than 15 mins' },
      { option_id: 2052, option_value: '15-30m', display_name: 'Between 15-30 mins' },
      { option_id: 2053, option_value: '30-60m', display_name: 'Between 30-60 mins' },
      { option_id: 2054, option_value: '1-2h', display_name: 'Between 1-2 hours' },
      { option_id: 2055, option_value: '2h-plus', display_name: 'More than 2 hours' },
    ],
  },
  {
    question_id: 206,
    question_key: 'sleep_duration',
    question_text: 'What is your average duration of good-quality sleep?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 2061, option_value: 'under-5', display_name: 'Less than 5 hours' },
      { option_id: 2062, option_value: '5-7', display_name: 'Between 5 to 7 hours' },
      { option_id: 2063, option_value: '7-9', display_name: 'Between 7 to 9 hours' },
      { option_id: 2064, option_value: '9-plus', display_name: 'More than 9 hours' },
    ],
  },
  {
    question_id: 207,
    question_key: 'alcohol_consumption',
    question_text: 'What is your alcohol consumption?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 2071, option_value: '3-or-less', display_name: '3 servings per week or less' },
      { option_id: 2072, option_value: 'quit', display_name: 'I quit alcohol' },
      { option_id: 2073, option_value: '1-2-per-3-months', display_name: '1-2 times in 3 months' },
      { option_id: 2074, option_value: 'never', display_name: 'I do not drink alcohol' },
      { option_id: 2075, option_value: '1-2-per-6-months', display_name: '1-2 times in 6 months' },
      {
        option_id: 2076,
        option_value: 'more-than-3',
        display_name: 'More than 3 servings per week',
      },
    ],
  },
  {
    question_id: 208,
    question_key: 'smoking_frequency',
    question_text: 'How often do you smoke cigarettes or tobacco?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 2081, option_value: 'never', display_name: 'I do not smoke' },
      { option_id: 2082, option_value: 'quit', display_name: 'I quit smoking' },
      { option_id: 2083, option_value: '1-3-weekly', display_name: '1-3 times a week' },
      { option_id: 2084, option_value: '1-2-monthly', display_name: '1-2 times a month' },
      { option_id: 2085, option_value: '4-5-monthly', display_name: '4-5 times a month' },
      { option_id: 2086, option_value: '5-7-weekly', display_name: '5-7 times a week' },
      {
        option_id: 2087,
        option_value: 'more-than-7-weekly',
        display_name: 'More than 7 times a week',
      },
    ],
  },
  {
    question_id: 209,
    question_key: 'wellness_priorities',
    question_text: 'What are your primary health and wellness priorities?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 2091, option_value: 'weight-loss', display_name: 'Weight loss' },
      { option_id: 2092, option_value: 'building-muscle', display_name: 'Building muscle mass' },
      { option_id: 2093, option_value: 'increase-energy', display_name: 'Increase energy levels' },
      {
        option_id: 2094,
        option_value: 'improving-metabolic',
        display_name: 'Improving metabolic health',
      },
      {
        option_id: 2095,
        option_value: 'improving-endurance',
        display_name: 'Improving physical endurance',
      },
      { option_id: 2096, option_value: 'increasing-strength', display_name: 'Increasing strength' },
    ],
  },
  {
    question_id: 210,
    question_key: 'lifestyle_commitment',
    question_text: 'Which lifestyle change are you most ready to commit to?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      {
        option_id: 2101,
        option_value: 'increasing-activity',
        display_name: 'Increasing physical activity',
      },
      { option_id: 2102, option_value: 'forming-habits', display_name: 'Forming healthy habits' },
      {
        option_id: 2103,
        option_value: 'reducing-diet',
        display_name: 'Reducing daily diet intake',
      },
    ],
  },
]

export const MOCK_ANTHROPOMETRY_QUESTIONS: QuestionnaireQuestion[] = [
  {
    question_id: 1,
    question_key: 'height',
    question_text: 'What is you height ?',
    question_type: 'scale',
    is_required: true,
    options: [
      { option_id: 11, option_value: '0', display_name: 'Cm' },
      { option_id: 12, option_value: '1', display_name: 'Ft/In' },
    ],
  },
  {
    question_id: 2,
    question_key: 'weight',
    question_text: 'What is you weight?',
    question_type: 'scale',
    is_required: true,
    options: [
      { option_id: 21, option_value: 'kg', display_name: 'Kg' },
      { option_id: 22, option_value: 'lb', display_name: 'Lb' },
    ],
  },
  {
    question_id: 3,
    question_key: 'waist_circumference',
    question_text: 'What is you waist size ?',
    question_type: 'scale',
    is_required: true,
    options: [
      { option_id: 31, option_value: 'in', display_name: 'In' },
      { option_id: 32, option_value: 'cm', display_name: 'cm' },
    ],
  },
  {
    question_id: 4,
    question_key: 'hip_circumference',
    question_text: 'What is you hip size ?',
    question_type: 'scale',
    is_required: false,
    options: [
      { option_id: 41, option_value: 'in', display_name: 'In' },
      { option_id: 42, option_value: 'cm', display_name: 'cm' },
    ],
  },
  {
    question_id: 5,
    question_key: 'body_fat',
    question_text: 'What is you body-fat percent ?',
    question_type: 'scale',
    is_required: false,
    options: [{ option_id: 51, option_value: '%', display_name: '%' }],
  },
]

export function getMockQuestionnaireQuestions(categoryKey: string): QuestionnaireQuestion[] {
  const key = String(categoryKey || '')
    .trim()
    .toLowerCase()
  if (key.includes('anthro')) return MOCK_ANTHROPOMETRY_QUESTIONS
  if (key.includes('family')) return MOCK_FAMILY_HISTORY_QUESTIONS
  if (key.includes('lifestyle')) return MOCK_LIFESTYLE_HABITS_QUESTIONS
  if (key.includes('nutrition')) return MOCK_NUTRITION_LOG_QUESTIONS
  return []
}

export const MOCK_NUTRITION_LOG_QUESTIONS: QuestionnaireQuestion[] = [
  {
    question_id: 301,
    question_key: 'diet_type',
    question_text: 'What type of diet do you primarily consume?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 3011, option_value: 'veg', display_name: 'Veg' },
      { option_id: 3012, option_value: 'jain', display_name: 'Jain' },
      { option_id: 3013, option_value: 'non-veg', display_name: 'Non-Veg' },
      { option_id: 3014, option_value: 'pescatarian', display_name: 'Pescatarian' },
      { option_id: 3015, option_value: 'eggetarian', display_name: 'Eggetarian' },
      { option_id: 3016, option_value: 'flexitarian', display_name: 'Flexitarian' },
    ],
  },
  {
    question_id: 302,
    question_key: 'daily_food_groups',
    question_text: 'Which of the following food groups do you consume every day?',
    question_type: 'multi_choice',
    is_required: true,
    help_text: '(Select all that apply)',
    options: [
      { option_id: 3021, option_value: 'pulses-legumes', display_name: 'Pulses / legumes' },
      { option_id: 3022, option_value: 'fresh-fruits', display_name: 'Fresh fruits' },
      { option_id: 3023, option_value: 'fresh-vegetables', display_name: 'Fresh vegetables' },
      { option_id: 3024, option_value: 'nuts-seeds', display_name: 'Nuts / seeds' },
    ],
  },
  {
    question_id: 303,
    question_key: 'breakfast_frequency',
    question_text: 'How frequently do you have a healthy homemade breakfast in a week?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 3031, option_value: 'more-than-5', display_name: 'More than 5 times' },
      { option_id: 3032, option_value: 'less-than-5', display_name: 'Less than 5 times' },
      { option_id: 3033, option_value: 'no-breakfast', display_name: 'I usually skip breakfast' },
    ],
  },
  {
    question_id: 304,
    question_key: 'fresh_fruits',
    question_text: 'How frequently do you consume fresh fruits?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 3041, option_value: 'daily', display_name: 'Daily' },
      { option_id: 3042, option_value: '3-5-week', display_name: '3-5 times a week' },
      { option_id: 3043, option_value: 'rarely', display_name: 'Rarely' },
    ],
  },
  {
    question_id: 305,
    question_key: 'fresh_vegetables',
    question_text: 'How frequently do you consume fresh vegetables?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 3051, option_value: 'daily', display_name: 'Daily' },
      { option_id: 3052, option_value: '3-5-week', display_name: '3-5 times a week' },
      { option_id: 3053, option_value: 'rarely', display_name: 'Rarely' },
    ],
  },
  {
    question_id: 306,
    question_key: 'baked_goods',
    question_text: 'How frequently do you consume cookies, biscuits, bread, or cakes?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 3061, option_value: 'daily', display_name: 'Daily' },
      { option_id: 3062, option_value: 'weekly', display_name: 'Weekly' },
      { option_id: 3063, option_value: 'rarely', display_name: 'Rarely' },
    ],
  },
  {
    question_id: 307,
    question_key: 'sugary_drinks',
    question_text: 'How frequently do you consume sugary drinks?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 3071, option_value: 'daily', display_name: 'Daily' },
      { option_id: 3072, option_value: 'weekly', display_name: 'Weekly' },
      { option_id: 3073, option_value: 'rarely', display_name: 'Rarely' },
    ],
  },
  {
    question_id: 308,
    question_key: 'iodized_salt',
    question_text: 'Do you use iodized salt at home?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 3081, option_value: 'yes', display_name: 'Yes' },
      { option_id: 3082, option_value: 'no', display_name: 'No' },
    ],
  },
  {
    question_id: 309,
    question_key: 'extra_salt',
    question_text: 'How often do you add extra salt to your food?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 3091, option_value: 'never', display_name: 'Never' },
      { option_id: 3092, option_value: 'rarely', display_name: 'Rarely' },
      { option_id: 3093, option_value: 'usually', display_name: 'Usually' },
    ],
  },
  {
    question_id: 310,
    question_key: 'coffee_tea_intake',
    question_text: 'How much coffee or tea do you drink in a day?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 3101, option_value: 'none', display_name: 'None' },
      { option_id: 3102, option_value: '1-2', display_name: '1-2 cups' },
      { option_id: 3103, option_value: '3-plus', display_name: '3+ cups' },
    ],
  },
  {
    question_id: 311,
    question_key: 'coffee_tea_type',
    question_text: 'What type of coffee or tea do you usually drink?',
    question_type: 'multi_choice',
    is_required: true,
    options: [
      { option_id: 3111, option_value: 'black', display_name: 'Black' },
      { option_id: 3112, option_value: 'with-milk', display_name: 'With milk' },
      { option_id: 3113, option_value: 'with-sugar', display_name: 'With sugar' },
    ],
  },
  {
    question_id: 312,
    question_key: 'market_butter',
    question_text: 'How frequently do you consume market butter or margarine?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 3121, option_value: 'daily', display_name: 'Daily' },
      { option_id: 3122, option_value: 'weekly', display_name: 'Weekly' },
      { option_id: 3123, option_value: 'rarely', display_name: 'Rarely' },
    ],
  },
  {
    question_id: 313,
    question_key: 'red_meat',
    question_text: 'How frequently do you consume red meat?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 3131, option_value: 'daily', display_name: 'Daily' },
      { option_id: 3132, option_value: 'weekly', display_name: 'Weekly' },
      { option_id: 3133, option_value: 'rarely', display_name: 'Rarely' },
    ],
  },
  {
    question_id: 314,
    question_key: 'water_intake',
    question_text: 'How many glasses of water do you drink in a day?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 3141, option_value: '8-plus', display_name: '8+' },
      { option_id: 3142, option_value: '6', display_name: '6' },
      { option_id: 3143, option_value: '4', display_name: '4' },
      { option_id: 3144, option_value: 'less-than-2', display_name: '< 2' },
    ],
  },
  {
    question_id: 315,
    question_key: 'illness_frequency',
    question_text: 'How often do you fall sick in a year?',
    question_type: 'single_choice',
    is_required: true,
    options: [
      { option_id: 3151, option_value: 'rarely', display_name: 'Rarely' },
      { option_id: 3152, option_value: '1-2', display_name: '1-2 times' },
      { option_id: 3153, option_value: '3-plus', display_name: '3+ times' },
    ],
  },
]
