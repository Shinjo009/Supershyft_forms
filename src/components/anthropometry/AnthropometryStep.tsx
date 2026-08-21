import { useEffect, useMemo, useState } from 'react'
import {
  submitQuestionnaireResponses,
  type QuestionnaireQuestion,
} from '../../api/questionnaire'
import hipGif from '../../assets/anthropometry/hip-gif.gif'
import waistGif from '../../assets/anthropometry/waist-gif.gif'
import { getAccessToken } from '../../lib/authStorage'
import { isFrontendOnly } from '../../lib/frontendOnly'
import { AnthropometryMcqShell } from './AnthropometryMcqShell'
import { HeightRulerPicker } from './HeightRulerPicker'
import { HorizontalRulerPicker } from './HorizontalRulerPicker'
import { WeightGaugePicker } from './WeightGaugePicker'
import {
  AnthropometryInfoButton,
  AnthropometryInfoPopup,
} from './AnthropometryPrimitives'
import {
  ANTHRO_QUESTION_COUNT,
  buildAnthropometryResponses,
  clamp,
  convertCircumference,
  convertWeight,
  DEFAULT_HEIGHT_CM,
  DEFAULT_HEIGHT_FEET,
  DEFAULT_HEIGHT_INCHES,
  DEFAULT_HIP_INCHES,
  DEFAULT_WAIST_INCHES,
  DEFAULT_WEIGHT_KG,
  extractUnitOptionsFromQuestion,
  findQuestionByAliasesAndHints,
  getCircumferenceRangeForUnit,
  getQuestionText,
  getWeightRangeForUnit,
  isCentimeterUnit,
  isFeetInchesUnit,
  isKilogramUnit,
  isPoundUnit,
  isProvidedNumber,
  MAX_HEIGHT_CM,
  MAX_HEIGHT_INCHES,
  MIN_HEIGHT_CM,
  MIN_HEIGHT_INCHES,
  prioritizeCircumferenceUnitOptions,
  prioritizeHeightUnitOptions,
  resolvePreferredUnitOption,
  roundToTenth,
  type AnthropometryFollowupValues,
  type AnthropometryPrimaryValues,
  type CircumferenceKind,
} from './anthropometryConfig'
import './anthropometry.css'

export function AnthropometryStep({
  questions = [],
  assessmentInstanceId,
  categoryId,
  onBack,
  onComplete,
}: {
  questions?: QuestionnaireQuestion[]
  assessmentInstanceId: number
  categoryId: number
  onBack: () => void
  onComplete: (payload: {
    primary: AnthropometryPrimaryValues
    followup: AnthropometryFollowupValues
  }) => void
}) {
  const [index, setIndex] = useState(0)
  const [height, setHeight] = useState(DEFAULT_HEIGHT_CM)
  const [weight, setWeight] = useState<number | null>(DEFAULT_WEIGHT_KG)
  const [waist, setWaist] = useState(Math.round(DEFAULT_WAIST_INCHES))
  const [heightUnit, setHeightUnit] = useState('Cm')
  const [weightUnit, setWeightUnit] = useState('Kg')
  const [waistUnit, setWaistUnit] = useState('In')
  const [heightFeet, setHeightFeet] = useState(DEFAULT_HEIGHT_FEET)
  const [heightInches, setHeightInches] = useState(DEFAULT_HEIGHT_INCHES)
  const [hipSize, setHipSize] = useState(Math.round(DEFAULT_HIP_INCHES))
  const [hipUnit, setHipUnit] = useState('In')
  const [showWaistInfo, setShowWaistInfo] = useState(false)
  const [showHipInfo, setShowHipInfo] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const heightLabel = getQuestionText(questions, ['height'], ['height'], 'What is you height ?')
  const weightLabel = getQuestionText(questions, ['weight'], ['weight', 'body weight'], 'What is you weight?')
  const waistLabel = getQuestionText(questions, ['waist_circumference', 'waist'], ['waist'], 'What is you waist size ?')
  const hipLabel = getQuestionText(questions, ['hip_circumference', 'hip'], ['hip'], 'What is you hip size ?')

  const previews = [
    { line1: weightLabel },
    { line1: waistLabel },
    { line1: hipLabel },
  ]

  const isLast = index >= ANTHRO_QUESTION_COUNT - 1
  const isWeightValid = isProvidedNumber(weight)

  const currentPrimary = (): AnthropometryPrimaryValues => ({
    height,
    weight,
    waist: roundToTenth(waist),
    heightUnit,
    weightUnit,
    waistUnit,
    heightFeet,
    heightInches,
  })

  const saveProgress = async (
    throughIndex: number,
    followup: AnthropometryFollowupValues = {},
  ) => {
    const responses = buildAnthropometryResponses(questions, currentPrimary(), followup, {
      throughIndex,
    })

    if (isFrontendOnly()) {
      console.info('[frontend-only] skipped anthropometry submit', {
        assessmentInstanceId,
        categoryId,
        throughIndex,
        responseCount: responses.length,
      })
      return
    }

    if (!Number.isFinite(assessmentInstanceId) || assessmentInstanceId <= 0 || categoryId <= 0) {
      throw new Error('Assessment category is missing. Go back and continue to Step 2 again.')
    }

    if (responses.length === 0) {
      throw new Error('Unable to save your measurements. Please try again.')
    }

    const accessToken = getAccessToken()
    console.info('[assessment] anthropometry responses submitting', {
      assessmentInstanceId,
      categoryId,
      throughIndex,
      responseCount: responses.length,
      responses,
    })
    await submitQuestionnaireResponses(
      accessToken,
      assessmentInstanceId,
      categoryId,
      responses,
    )
    console.info('[assessment] anthropometry responses saved', {
      assessmentInstanceId,
      categoryId,
      responseCount: responses.length,
    })
  }

  const completeSection = async (followup: AnthropometryFollowupValues) => {
    await saveProgress(ANTHRO_QUESTION_COUNT - 1, followup)
    onComplete({
      primary: currentPrimary(),
      followup,
    })
  }

  const runSave = async (work: () => Promise<void>) => {
    if (isSaving) return
    setSaveError('')
    setIsSaving(true)
    try {
      await work()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save your measurements.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleNext = () => {
    if (isSaving) return
    if (index === 1 && !isWeightValid) {
      setSubmitAttempted(true)
      return
    }

    void runSave(async () => {
      if (isLast) {
        await completeSection({
          hipSize: roundToTenth(hipSize),
          hipUnit,
        })
        return
      }

      await saveProgress(index)
      setIndex((current) => current + 1)
    })
  }

  const handleBack = () => {
    if (isSaving) return
    if (index === 0) {
      onBack()
      return
    }
    setSaveError('')
    setIndex((current) => current - 1)
  }

  return (
    <AnthropometryMcqShell
      progressPercent={Math.round(((index + 1) / ANTHRO_QUESTION_COUNT) * 100)}
      onBack={handleBack}
      onNext={handleNext}
      nextDisabled={isSaving}
      isSaving={isSaving}
      saveError={saveError}
      nextQuestionPreview={isLast ? undefined : previews[index]}
    >
      {index === 0 ? (
        <HeightQuestion
          questions={questions}
          label={heightLabel}
          height={height}
          heightUnit={heightUnit}
          onHeightChange={setHeight}
          onUnitChange={(unit, nextHeight, feet, inches) => {
            setHeightUnit(unit)
            setHeight(nextHeight)
            setHeightFeet(feet)
            setHeightInches(inches)
          }}
        />
      ) : null}

      {index === 1 ? (
        <WeightQuestion
          questions={questions}
          label={weightLabel}
          weight={weight}
          weightUnit={weightUnit}
          showRequired={submitAttempted && !isWeightValid}
          onWeightChange={(next) => {
            setWeight(next)
            if (isProvidedNumber(next)) setSubmitAttempted(false)
          }}
          onUnitChange={setWeightUnit}
        />
      ) : null}

      {index === 2 ? (
        <WaistQuestion
          questions={questions}
          label={waistLabel}
          waist={waist}
          waistUnit={waistUnit}
          onWaistChange={setWaist}
          onUnitChange={setWaistUnit}
          onOpenInfo={() => setShowWaistInfo(true)}
        />
      ) : null}

      {index === 3 ? (
        <HipQuestion
          questions={questions}
          label={hipLabel}
          hipSize={hipSize}
          hipUnit={hipUnit}
          onHipChange={setHipSize}
          onUnitChange={setHipUnit}
          onOpenInfo={() => setShowHipInfo(true)}
          onSkip={() => {
            if (isSaving) return
            void runSave(async () => {
              await completeSection({
                hipUnit,
              })
            })
          }}
        />
      ) : null}

      <AnthropometryInfoPopup
        open={showWaistInfo}
        label="Waist size information"
        gifSrc={waistGif}
        onClose={() => setShowWaistInfo(false)}
      />
      <AnthropometryInfoPopup
        open={showHipInfo}
        label="Hip size information"
        gifSrc={hipGif}
        onClose={() => setShowHipInfo(false)}
      />
    </AnthropometryMcqShell>
  )
}

function QuestionChrome({
  index,
  children,
}: {
  index: number
  children: string
}) {
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <p className="font-['DM_Sans'] text-sm font-medium leading-5 text-white/40">
        Question {index + 1} of {ANTHRO_QUESTION_COUNT}
      </p>
      <p className="font-['Lato'] text-base font-normal tracking-tight text-white">{children}</p>
    </div>
  )
}

function HeightQuestion({
  questions,
  label,
  height,
  heightUnit,
  onHeightChange,
  onUnitChange,
}: {
  questions: QuestionnaireQuestion[]
  label: string
  height: number
  heightUnit: string
  onHeightChange: (value: number) => void
  onUnitChange: (unit: string, heightCm: number, feet: number, inches: number) => void
}) {
  const heightQuestion = useMemo(
    () => findQuestionByAliasesAndHints(questions, ['height'], ['height']),
    [questions],
  )
  const heightUnitOptions = useMemo(
    () => prioritizeHeightUnitOptions(extractUnitOptionsFromQuestion(heightQuestion)),
    [heightQuestion],
  )
  const cmOption = heightUnitOptions.find((option) => isCentimeterUnit(option)) || 'Cm'
  const ftOption = heightUnitOptions.find((option) => isFeetInchesUnit(option)) || 'Ft/In'
  const usesFeet = isFeetInchesUnit(heightUnit)
  const totalInches = clamp(height / 2.54, MIN_HEIGHT_INCHES, MAX_HEIGHT_INCHES)

  useEffect(() => {
    const preferred = resolvePreferredUnitOption(heightUnitOptions, heightUnit, 'Cm')
    if (preferred !== heightUnit) {
      onUnitChange(
        preferred,
        height,
        Math.floor(totalInches / 12),
        Math.round((totalInches % 12) * 10) / 10,
      )
    }
  }, [heightUnitOptions]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectUnit = (nextUnit: string) => {
    if (isFeetInchesUnit(nextUnit)) {
      const inches = clamp(height / 2.54, MIN_HEIGHT_INCHES, MAX_HEIGHT_INCHES)
      const whole = Math.round(inches)
      onUnitChange(nextUnit, whole * 2.54, Math.floor(whole / 12), whole % 12)
      return
    }
    const nextCm = clamp(height, MIN_HEIGHT_CM, MAX_HEIGHT_CM)
    const total = nextCm / 2.54
    onUnitChange(nextUnit, nextCm, Math.floor(total / 12), total % 12)
  }

  return (
    <div className="flex w-full flex-col items-center gap-7 pb-4 pt-2">
      <QuestionChrome index={0}>{label}</QuestionChrome>
      <div className="flex w-full flex-col items-center gap-5">
        <div className="inline-flex items-start rounded-full bg-black/30 p-1 outline outline-1 outline-offset-[-1px] outline-white/10">
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-center text-xs font-medium leading-4 ${
              !usesFeet ? 'bg-white/10 text-white' : 'text-neutral-400'
            }`}
            onClick={() => selectUnit(cmOption)}
          >
            Centimeters
          </button>
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-center text-xs font-medium leading-4 ${
              usesFeet ? 'bg-white/10 text-white' : 'text-neutral-400'
            }`}
            onClick={() => selectUnit(ftOption)}
          >
            Feet/inches
          </button>
        </div>

        {usesFeet ? (
          <HeightRulerPicker
            key="ft"
            value={clamp(Math.round(totalInches), MIN_HEIGHT_INCHES, MAX_HEIGHT_INCHES)}
            min={MIN_HEIGHT_INCHES}
            max={MAX_HEIGHT_INCHES}
            step={0.1}
            snapStep={1}
            unitLabel=""
            formatValue={(inches) => {
              const rounded = Math.round(inches)
              const feet = Math.floor(rounded / 12)
              const rest = rounded % 12
              return `${feet}.${rest}`
            }}
            formatTickLabel={(inches) => {
              const feet = Math.floor(inches / 12)
              const rest = Math.round(inches % 12)
              return `${feet}'${rest}"`
            }}
            onChange={(inches) => {
              const whole = clamp(Math.round(inches), MIN_HEIGHT_INCHES, MAX_HEIGHT_INCHES)
              onUnitChange(heightUnit, whole * 2.54, Math.floor(whole / 12), whole % 12)
            }}
          />
        ) : (
          <HeightRulerPicker
            key="cm"
            value={clamp(height, MIN_HEIGHT_CM, MAX_HEIGHT_CM)}
            min={MIN_HEIGHT_CM}
            max={MAX_HEIGHT_CM}
            step={0.1}
            unitLabel="cm"
            onChange={(next) => onHeightChange(clamp(next, MIN_HEIGHT_CM, MAX_HEIGHT_CM))}
          />
        )}
      </div>
    </div>
  )
}

function WeightQuestion({
  questions,
  label,
  weight,
  weightUnit,
  showRequired,
  onWeightChange,
  onUnitChange,
}: {
  questions: QuestionnaireQuestion[]
  label: string
  weight: number | null
  weightUnit: string
  showRequired: boolean
  onWeightChange: (value: number | null) => void
  onUnitChange: (unit: string) => void
}) {
  const weightQuestion = useMemo(
    () => findQuestionByAliasesAndHints(questions, ['weight'], ['weight', 'body weight']),
    [questions],
  )
  const weightUnitOptions = useMemo(() => {
    const extracted = extractUnitOptionsFromQuestion(weightQuestion)
    return extracted.length > 0 ? extracted : ['Kg', 'Lb']
  }, [weightQuestion])

  const kgOption = weightUnitOptions.find((option) => isKilogramUnit(option)) || 'Kg'
  const lbOption = weightUnitOptions.find((option) => isPoundUnit(option)) || 'Lb'
  const usesPounds = isPoundUnit(weightUnit)
  const range = getWeightRangeForUnit(weightUnit)
  const gaugeValue = weight == null ? range.defaultValue : clamp(weight, range.min, range.max)
  const unitLabel = usesPounds ? 'Lb' : 'Kg'

  useEffect(() => {
    onUnitChange(resolvePreferredUnitOption(weightUnitOptions, weightUnit, 'Kg'))
  }, [weightUnitOptions]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectUnit = (nextUnit: string) => {
    if (nextUnit === weightUnit) return
    onWeightChange(convertWeight(gaugeValue, weightUnit, nextUnit))
    onUnitChange(nextUnit)
  }

  return (
    <div className="flex w-full flex-col items-center gap-7 pb-4 pt-2">
      <QuestionChrome index={1}>{label}</QuestionChrome>
      <div className="flex w-full flex-col items-center gap-10">
        <div className="inline-flex items-start rounded-full bg-black/30 p-1 outline outline-1 outline-offset-[-1px] outline-white/10">
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-center font-['DM_Sans'] text-xs font-medium leading-4 ${
              !usesPounds ? 'bg-white/10 text-white' : 'text-neutral-400'
            }`}
            onClick={() => selectUnit(kgOption)}
          >
            Kilograms
          </button>
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-center font-['DM_Sans'] text-xs font-medium leading-4 ${
              usesPounds ? 'bg-white/10 text-white' : 'text-neutral-400'
            }`}
            onClick={() => selectUnit(lbOption)}
          >
            Pounds
          </button>
        </div>

        <WeightGaugePicker
          key={usesPounds ? 'lb' : 'kg'}
          value={gaugeValue}
          min={range.min}
          max={range.max}
          unitLabel={unitLabel}
          onChange={(next) => onWeightChange(clamp(next, range.min, range.max))}
        />
      </div>
      {showRequired ? <p className="text-center text-sm text-[#f5a9a9]">Please enter your weight</p> : null}
    </div>
  )
}

const WAIST_ALIASES = ['waist_circumference', 'waist']
const WAIST_HINTS = ['waist']
const HIP_ALIASES = ['hip_circumference', 'hip_size', 'hip']
const HIP_HINTS = ['hip']

function CircumferenceQuestion({
  questions,
  label,
  index,
  value,
  unit,
  kind,
  aliases,
  hints,
  infoLabel,
  onChange,
  onUnitChange,
  onOpenInfo,
  onSkip,
}: {
  questions: QuestionnaireQuestion[]
  label: string
  index: number
  value: number
  unit: string
  kind: CircumferenceKind
  aliases: string[]
  hints: string[]
  infoLabel: string
  onChange: (value: number) => void
  onUnitChange: (unit: string) => void
  onOpenInfo: () => void
  onSkip?: () => void
}) {
  const question = useMemo(() => findQuestionByAliasesAndHints(questions, aliases, hints), [aliases, hints, questions])
  const unitOptions = useMemo(
    () => prioritizeCircumferenceUnitOptions(extractUnitOptionsFromQuestion(question)),
    [question],
  )
  const cmOption = unitOptions.find((option) => isCentimeterUnit(option)) || 'Cm'
  const inOption = unitOptions.find((option) => !isCentimeterUnit(option)) || 'In'
  const usesCm = isCentimeterUnit(unit)
  const range = getCircumferenceRangeForUnit(unit, kind)
  const unitLabel = usesCm ? 'Cms' : 'In'

  useEffect(() => {
    onUnitChange(resolvePreferredUnitOption(unitOptions, unit, 'In'))
  }, [unitOptions]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectUnit = (nextUnit: string) => {
    if (nextUnit === unit) return
    onChange(convertCircumference(value, unit, nextUnit, kind))
    onUnitChange(nextUnit)
  }

  return (
    <div className="flex w-full flex-col items-center gap-7 pb-4 pt-2">
      <div className="relative w-full">
        <QuestionChrome index={index}>{label}</QuestionChrome>
        <AnthropometryInfoButton label={infoLabel} onClick={onOpenInfo} />
      </div>
      <div className="flex w-full flex-col items-center gap-10">
        <div className="inline-flex items-start rounded-full bg-black/30 p-1 outline outline-1 outline-offset-[-1px] outline-white/10">
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-center font-['DM_Sans'] text-xs font-medium leading-4 ${
              usesCm ? 'bg-white/10 text-white' : 'text-neutral-400'
            }`}
            onClick={() => selectUnit(cmOption)}
          >
            Centimeters
          </button>
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-center font-['DM_Sans'] text-xs font-medium leading-4 ${
              !usesCm ? 'bg-white/10 text-white' : 'text-neutral-400'
            }`}
            onClick={() => selectUnit(inOption)}
          >
            Inches
          </button>
        </div>

        <HorizontalRulerPicker
          key={usesCm ? 'cm' : 'in'}
          value={clamp(Math.round(value), range.min, range.max)}
          min={range.min}
          max={range.max}
          step={0.1}
          snapStep={1}
          unitLabel={unitLabel}
          onChange={(next) => onChange(clamp(Math.round(next), range.min, range.max))}
        />
      </div>
      {onSkip ? (
        <button type="button" className="text-sm font-normal tracking-tight text-zinc-400 underline" onClick={onSkip}>
          Skip
        </button>
      ) : null}
    </div>
  )
}

function WaistQuestion({
  questions,
  label,
  waist,
  waistUnit,
  onWaistChange,
  onUnitChange,
  onOpenInfo,
}: {
  questions: QuestionnaireQuestion[]
  label: string
  waist: number
  waistUnit: string
  onWaistChange: (value: number) => void
  onUnitChange: (unit: string) => void
  onOpenInfo: () => void
}) {
  return (
    <CircumferenceQuestion
      questions={questions}
      label={label}
      index={2}
      value={waist}
      unit={waistUnit}
      kind="waist"
      aliases={WAIST_ALIASES}
      hints={WAIST_HINTS}
      infoLabel="Open waist size information"
      onChange={onWaistChange}
      onUnitChange={onUnitChange}
      onOpenInfo={onOpenInfo}
    />
  )
}

function HipQuestion({
  questions,
  label,
  hipSize,
  hipUnit,
  onHipChange,
  onUnitChange,
  onOpenInfo,
  onSkip,
}: {
  questions: QuestionnaireQuestion[]
  label: string
  hipSize: number
  hipUnit: string
  onHipChange: (value: number) => void
  onUnitChange: (unit: string) => void
  onOpenInfo: () => void
  onSkip: () => void
}) {
  return (
    <CircumferenceQuestion
      questions={questions}
      label={label}
      index={3}
      value={hipSize}
      unit={hipUnit}
      kind="hip"
      aliases={HIP_ALIASES}
      hints={HIP_HINTS}
      infoLabel="Open hip size information"
      onChange={onHipChange}
      onUnitChange={onUnitChange}
      onOpenInfo={onOpenInfo}
      onSkip={onSkip}
    />
  )
}
