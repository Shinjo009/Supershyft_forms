/**
 * Frontend-only / no-send mode for UI redesign.
 *
 * When true:
 * - Booking, questionnaire answers, and assessment submits are NOT sent to the backend
 * - Assessment categories use local mock data
 * - Questionnaires use API-shaped mock questions so layouts can be redesigned one-by-one
 *
 * Set to false when you want live API behavior again.
 */
export const FRONTEND_ONLY = false

export function isFrontendOnly(): boolean {
  return FRONTEND_ONLY
}
