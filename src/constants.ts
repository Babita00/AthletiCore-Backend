// Static form field keys for powerlifting events
export const FORM_FIELD_KEYS = {
  // Personal Information
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  AGE: 'age',
  GENDER: 'gender',
  BODY_WEIGHT: 'bodyWeight',
  HEIGHT: 'height',
  RACK_HEIGHT: 'rackHeight',

  // Initial Lift Weights
  INITIAL_SQUAT_WEIGHT: 'static-initial-weight-for-squat',
  INITIAL_BENCH_WEIGHT: 'static-initial-weight-for-bench-press',
  INITIAL_DEADLIFT_WEIGHT: 'static-initial-weight-for-deadlift',
} as const;

// Static fields array for powerlifting event registration
export const POWERLIFTING_STATIC_FIELDS = [
  {
    id: 'personal-info-section',
    fieldName: 'personalInfoHeader',
    fieldType: 'header' as const,
    required: false,
    label: 'Personal Information',
  },
  {
    id: 'first-name',
    fieldName: FORM_FIELD_KEYS.FIRST_NAME,
    fieldType: 'text' as const,
    required: true,
    label: 'First Name',
  },
  {
    id: 'last-name',
    fieldName: FORM_FIELD_KEYS.LAST_NAME,
    fieldType: 'text' as const,
    required: true,
    label: 'Last Name',
  },
  {
    id: 'age',
    fieldName: FORM_FIELD_KEYS.AGE,
    fieldType: 'number' as const,
    required: true,
    label: 'Age',
  },
  {
    id: 'gender',
    fieldName: FORM_FIELD_KEYS.GENDER,
    fieldType: 'select' as const,
    required: true,
    label: 'Gender',
    options: ['Male', 'Female', 'Other'],
  },
  {
    id: 'body-weight',
    fieldName: FORM_FIELD_KEYS.BODY_WEIGHT,
    fieldType: 'number' as const,
    required: true,
    label: 'Body Weight (kg)',
  },
  {
    id: 'height',
    fieldName: FORM_FIELD_KEYS.HEIGHT,
    fieldType: 'text' as const,
    required: true,
    label: 'Height (cm)',
  },
  {
    id: 'rack-height',
    fieldName: FORM_FIELD_KEYS.RACK_HEIGHT,
    fieldType: 'text' as const,
    required: true,
    label: 'Rack Height',
  },
  {
    id: 'initial-weights-section',
    fieldName: 'initialWeightsHeader',
    fieldType: 'header' as const,
    required: false,
    label: 'Initial Lift Weights',
  },
  {
    id: 'initial-squat-weight',
    fieldName: FORM_FIELD_KEYS.INITIAL_SQUAT_WEIGHT,
    fieldType: 'number' as const,
    required: true,
    label: 'Initial Squat Weight (kg)',
  },
  {
    id: 'initial-bench-weight',
    fieldName: FORM_FIELD_KEYS.INITIAL_BENCH_WEIGHT,
    fieldType: 'number' as const,
    required: true,
    label: 'Initial Bench Press Weight (kg)',
  },
  {
    id: 'initial-deadlift-weight',
    fieldName: FORM_FIELD_KEYS.INITIAL_DEADLIFT_WEIGHT,
    fieldType: 'number' as const,
    required: true,
    label: 'Initial Deadlift Weight (kg)',
  },
];

// Lift types
export const LIFT_TYPES = {
  SQUAT: 'squat',
  BENCH: 'bench',
  DEADLIFT: 'deadlift',
} as const;

// Attempt statuses
export const ATTEMPT_STATUS = {
  PENDING: 'pending',
  PASS: 'pass',
  FAIL: 'fail',
} as const;
