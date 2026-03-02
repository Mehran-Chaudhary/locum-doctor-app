// ─── Roles ────────────────────────────────────────────────────────────────────
export const Role = { DOCTOR: 'DOCTOR', HOSPITAL: 'HOSPITAL', SUPER_ADMIN: 'SUPER_ADMIN' } as const;
export type Role = (typeof Role)[keyof typeof Role];

// ─── Account Status ───────────────────────────────────────────────────────────
export const AccountStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

// ─── Specialty ────────────────────────────────────────────────────────────────
export const Specialty = {
  MEDICAL_OFFICER: 'MEDICAL_OFFICER',
  ER_SPECIALIST: 'ER_SPECIALIST',
  SURGEON: 'SURGEON',
  PEDIATRICIAN: 'PEDIATRICIAN',
  GYNECOLOGIST: 'GYNECOLOGIST',
  ANESTHESIOLOGIST: 'ANESTHESIOLOGIST',
  RADIOLOGIST: 'RADIOLOGIST',
  PATHOLOGIST: 'PATHOLOGIST',
  CARDIOLOGIST: 'CARDIOLOGIST',
  NEUROLOGIST: 'NEUROLOGIST',
  ORTHOPEDIC: 'ORTHOPEDIC',
  DERMATOLOGIST: 'DERMATOLOGIST',
  PSYCHIATRIST: 'PSYCHIATRIST',
  GENERAL_PHYSICIAN: 'GENERAL_PHYSICIAN',
  OTHER: 'OTHER',
} as const;
export type Specialty = (typeof Specialty)[keyof typeof Specialty];

export const SPECIALTY_OPTIONS: { value: Specialty; label: string }[] = [
  { value: 'MEDICAL_OFFICER', label: 'Medical Officer' },
  { value: 'ER_SPECIALIST', label: 'ER Specialist' },
  { value: 'SURGEON', label: 'Surgeon' },
  { value: 'PEDIATRICIAN', label: 'Pediatrician' },
  { value: 'GYNECOLOGIST', label: 'Gynecologist' },
  { value: 'ANESTHESIOLOGIST', label: 'Anesthesiologist' },
  { value: 'RADIOLOGIST', label: 'Radiologist' },
  { value: 'PATHOLOGIST', label: 'Pathologist' },
  { value: 'CARDIOLOGIST', label: 'Cardiologist' },
  { value: 'NEUROLOGIST', label: 'Neurologist' },
  { value: 'ORTHOPEDIC', label: 'Orthopedic' },
  { value: 'DERMATOLOGIST', label: 'Dermatologist' },
  { value: 'PSYCHIATRIST', label: 'Psychiatrist' },
  { value: 'GENERAL_PHYSICIAN', label: 'General Physician' },
  { value: 'OTHER', label: 'Other' },
];

// ─── Department ───────────────────────────────────────────────────────────────
export const Department = {
  EMERGENCY: 'EMERGENCY',
  PEDIATRICS: 'PEDIATRICS',
  SURGERY: 'SURGERY',
  GYNECOLOGY: 'GYNECOLOGY',
  ANESTHESIOLOGY: 'ANESTHESIOLOGY',
  RADIOLOGY: 'RADIOLOGY',
  PATHOLOGY: 'PATHOLOGY',
  CARDIOLOGY: 'CARDIOLOGY',
  NEUROLOGY: 'NEUROLOGY',
  ORTHOPEDICS: 'ORTHOPEDICS',
  DERMATOLOGY: 'DERMATOLOGY',
  PSYCHIATRY: 'PSYCHIATRY',
  GENERAL_MEDICINE: 'GENERAL_MEDICINE',
  ICU: 'ICU',
  OPD: 'OPD',
  OTHER: 'OTHER',
} as const;
export type Department = (typeof Department)[keyof typeof Department];

export const DEPARTMENT_OPTIONS: { value: Department; label: string }[] = [
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'PEDIATRICS', label: 'Pediatrics' },
  { value: 'SURGERY', label: 'Surgery' },
  { value: 'GYNECOLOGY', label: 'Gynecology' },
  { value: 'ANESTHESIOLOGY', label: 'Anesthesiology' },
  { value: 'RADIOLOGY', label: 'Radiology' },
  { value: 'PATHOLOGY', label: 'Pathology' },
  { value: 'CARDIOLOGY', label: 'Cardiology' },
  { value: 'NEUROLOGY', label: 'Neurology' },
  { value: 'ORTHOPEDICS', label: 'Orthopedics' },
  { value: 'DERMATOLOGY', label: 'Dermatology' },
  { value: 'PSYCHIATRY', label: 'Psychiatry' },
  { value: 'GENERAL_MEDICINE', label: 'General Medicine' },
  { value: 'ICU', label: 'ICU' },
  { value: 'OPD', label: 'OPD' },
  { value: 'OTHER', label: 'Other' },
];

// ─── Shift Status ─────────────────────────────────────────────────────────────
export const ShiftStatus = {
  OPEN: 'OPEN', FILLED: 'FILLED', IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED', EXPIRED: 'EXPIRED', CANCELLED: 'CANCELLED',
} as const;
export type ShiftStatus = (typeof ShiftStatus)[keyof typeof ShiftStatus];

// ─── Shift Urgency ────────────────────────────────────────────────────────────
export const ShiftUrgency = { NORMAL: 'NORMAL', URGENT: 'URGENT' } as const;
export type ShiftUrgency = (typeof ShiftUrgency)[keyof typeof ShiftUrgency];

// ─── Application Status ───────────────────────────────────────────────────────
export const ApplicationStatus = {
  APPLIED: 'APPLIED', ACCEPTED: 'ACCEPTED', REJECTED: 'REJECTED', WITHDRAWN: 'WITHDRAWN',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

// ─── Timesheet Status ─────────────────────────────────────────────────────────
export const TimesheetStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL', APPROVED: 'APPROVED', DISPUTED: 'DISPUTED', RESOLVED: 'RESOLVED',
} as const;
export type TimesheetStatus = (typeof TimesheetStatus)[keyof typeof TimesheetStatus];

// ─── Reviewer Type ────────────────────────────────────────────────────────────
export const ReviewerType = {
  HOSPITAL_REVIEWING_DOCTOR: 'HOSPITAL_REVIEWING_DOCTOR',
  DOCTOR_REVIEWING_HOSPITAL: 'DOCTOR_REVIEWING_HOSPITAL',
} as const;
export type ReviewerType = (typeof ReviewerType)[keyof typeof ReviewerType];

// ─── Ledger Entry Type ────────────────────────────────────────────────────────
export const LedgerEntryType = {
  SHIFT_PAYMENT: 'SHIFT_PAYMENT',
  PLATFORM_COMMISSION: 'PLATFORM_COMMISSION',
  DOCTOR_NET_EARNING: 'DOCTOR_NET_EARNING',
} as const;
export type LedgerEntryType = (typeof LedgerEntryType)[keyof typeof LedgerEntryType];

// ─── Ledger Entry Status ──────────────────────────────────────────────────────
export const LedgerEntryStatus = {
  PENDING_CLEARANCE: 'PENDING_CLEARANCE', CLEARED: 'CLEARED', WITHDRAWN: 'WITHDRAWN',
} as const;
export type LedgerEntryStatus = (typeof LedgerEntryStatus)[keyof typeof LedgerEntryStatus];

// ─── Upload Types ─────────────────────────────────────────────────────────────
export const UploadType = {
  PROFILE_PIC: 'profile-pic',
  PMDC_CERT: 'pmdc-cert',
  HOSPITAL_LOGO: 'hospital-logo',
} as const;
export type UploadType = (typeof UploadType)[keyof typeof UploadType];
