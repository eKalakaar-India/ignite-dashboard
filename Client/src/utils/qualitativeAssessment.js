export const QUALITATIVE_TARGET_GROUPS = [
  'Student',
  'Teacher/Principal',
  'Community Member',
  'Parent',
]

const emptyAssessment = (type) => ({
  type,
  session_assesment: '',
  key_concern: '',
  perception_change: '',
  suggestion: '',
})

export function createAssessmentData() {
  return QUALITATIVE_TARGET_GROUPS.map(emptyAssessment)
}

export function normalizeAssessmentData(assessmentData) {
  if (Array.isArray(assessmentData)) {
    const assessmentsByType = new Map(
      assessmentData
        .filter((assessment) => assessment && QUALITATIVE_TARGET_GROUPS.includes(assessment.type))
        .map((assessment) => [assessment.type, assessment])
    )
    return QUALITATIVE_TARGET_GROUPS.map((type) => ({
      ...emptyAssessment(type),
      ...(assessmentsByType.get(type) || {}),
      type,
    }))
  }

  const assessments = createAssessmentData()
  if (assessmentData && typeof assessmentData === 'object') {
    const targetType = QUALITATIVE_TARGET_GROUPS.includes(assessmentData.type)
      ? assessmentData.type
      : QUALITATIVE_TARGET_GROUPS[0]
    return assessments.map((assessment) => (
      assessment.type === targetType ? { ...assessment, ...assessmentData, type: targetType } : assessment
    ))
  }
  return assessments
}

export function hasAssessmentResponses(assessments = []) {
  return assessments.some((assessment) =>
    [assessment.session_assesment, assessment.key_concern, assessment.perception_change, assessment.suggestion]
      .some((value) => typeof value === 'string' ? value.trim() !== '' : Boolean(value))
  )
}
