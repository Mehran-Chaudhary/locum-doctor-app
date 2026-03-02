import type { Role, AccountStatus, Specialty, Department, ShiftStatus, ShiftUrgency, ApplicationStatus } from '../constants/enums';

// ─── API Envelope ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  role: Role;
  status: AccountStatus;
  createdAt: string;
  updatedAt?: string;
  doctorProfile: DoctorProfile | null;
  hospitalProfile: HospitalProfile | null;
}

// ─── Doctor Profile ───────────────────────────────────────────────────────────
export interface DoctorProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  pmdcNumber: string;
  specialty: Specialty;
  yearsExperience: number;
  hourlyRate: string; // Decimal → string from Prisma
  bio: string | null;
  profilePicUrl: string | null;
  pmdcCertUrl: string | null;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Hospital Profile ─────────────────────────────────────────────────────────
export interface HospitalProfile {
  id: string;
  userId: string;
  hospitalName: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  healthCommRegNumber: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string | null;
  logoUrl: string | null;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth Request / Response DTOs ─────────────────────────────────────────────
export interface RegisterRequest {
  email: string;
  password: string;
  phone: string;
  role: 'DOCTOR' | 'HOSPITAL';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
  devOtp?: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface VerifyOtpRequest {
  code: string;
}

export interface ResendOtpResponse {
  message: string;
  devOtp?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  devResetToken?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ─── Doctor Profile DTOs ──────────────────────────────────────────────────────
export interface CreateDoctorProfileRequest {
  firstName: string;
  lastName: string;
  city: string;
  latitude?: number;
  longitude?: number;
  pmdcNumber: string;
  specialty: Specialty;
  yearsExperience: number;
  hourlyRate: number;
  bio?: string;
}

export interface UpdateDoctorProfileRequest {
  firstName?: string;
  lastName?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  pmdcNumber?: string;
  specialty?: Specialty;
  yearsExperience?: number;
  hourlyRate?: number;
  bio?: string;
}

// ─── Hospital Profile DTOs ────────────────────────────────────────────────────
export interface CreateHospitalProfileRequest {
  hospitalName: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  healthCommRegNumber: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail?: string;
}

export interface UpdateHospitalProfileRequest {
  hospitalName?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  healthCommRegNumber?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
}

// ─── Upload DTOs ──────────────────────────────────────────────────────────────
export interface UploadResponse {
  message: string;
  url: string;
  type: string;
}

// ─── Shift ────────────────────────────────────────────────────────────────────

/** Partial hospital profile embedded inside shift responses. */
export interface ShiftHospitalProfile {
  id: string;
  hospitalName: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  logoUrl: string | null;
  averageRating: number;
  totalReviews: number;
}

export interface Shift {
  id: string;
  hospitalProfileId: string;
  title: string;
  department: Department;
  requiredSpecialty: Specialty;
  description: string | null;
  startTime: string;
  endTime: string;
  hourlyRate: string;
  totalDurationHrs: number;
  totalEstimatedPay: string;
  urgency: ShiftUrgency;
  status: ShiftStatus;
  createdAt: string;
  updatedAt: string;
  hospitalProfile?: ShiftHospitalProfile;
  _count?: { applications: number };
  /** Haversine distance in km from doctor — null if coords missing. */
  distanceKm?: number | null;
}

export interface CreateShiftRequest {
  title: string;
  department: Department;
  requiredSpecialty: Specialty;
  description?: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  urgency?: ShiftUrgency;
}

export interface ShiftFeedParams {
  city?: string;
  specialty?: Specialty;
  dateFrom?: string;
  dateTo?: string;
  maxDistanceKm?: number;
  sortBy?: 'starting_soonest' | 'highest_pay' | 'distance';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Shift Application ───────────────────────────────────────────────────────

/** Partial doctor profile embedded inside applicant responses. */
export interface ApplicantDoctorProfile {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  pmdcNumber: string;
  specialty: Specialty;
  yearsExperience: number;
  hourlyRate: string;
  bio: string | null;
  profilePicUrl: string | null;
  averageRating: number;
  totalReviews: number;
  user?: { status: AccountStatus; phoneVerified: boolean };
}

export interface ShiftApplication {
  id: string;
  shiftId: string;
  doctorProfileId: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  shift?: Shift & { hospitalProfile?: ShiftHospitalProfile };
  doctorProfile?: ApplicantDoctorProfile;
}

export interface ApplyForShiftRequest {
  shiftId: string;
}

export interface ShiftApplicantsResponse {
  shiftId: string;
  shiftTitle: string;
  totalApplicants: number;
  applicants: ShiftApplication[];
}

export interface AcceptApplicationResponse {
  message: string;
  application: ShiftApplication;
}

// ─── Timesheet ────────────────────────────────────────────────────────────────

import type { TimesheetStatus } from '../constants/enums';

/** Partial shift info embedded inside timesheet responses. */
export interface TimesheetShift {
  id?: string;
  hospitalProfileId?: string;
  title: string;
  department: Department;
  requiredSpecialty?: Specialty;
  description?: string | null;
  startTime: string;
  endTime: string;
  hourlyRate: string;
  totalDurationHrs?: number;
  totalEstimatedPay?: string;
  urgency?: ShiftUrgency;
  status?: ShiftStatus;
  hospitalProfile?: {
    hospitalName: string;
    address?: string;
    city: string;
    logoUrl?: string | null;
  };
}

/** Partial doctor profile embedded inside hospital timesheet responses. */
export interface TimesheetDoctorProfile {
  firstName: string;
  lastName: string;
  pmdcNumber: string;
  specialty: Specialty;
  profilePicUrl: string | null;
}

/** Partial hospital profile embedded inside doctor timesheet responses. */
export interface TimesheetHospitalProfile {
  hospitalName: string;
  address?: string;
  city: string;
  logoUrl?: string | null;
}

export interface Timesheet {
  id: string;
  shiftId: string;
  doctorProfileId: string;
  hospitalProfileId: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  hoursWorked: string | null;       // Decimal → string from Prisma
  finalCalculatedPay: string | null; // Decimal → string from Prisma
  status: TimesheetStatus;
  disputeNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  shift?: TimesheetShift;
  hospitalProfile?: TimesheetHospitalProfile;
  doctorProfile?: TimesheetDoctorProfile;
}

// ─── Timesheet Request / Response DTOs ────────────────────────────────────────

export interface ClockInRequest {
  latitude: number;
  longitude: number;
}

export interface ClockOutRequest {
  latitude: number;
  longitude: number;
}

export interface ClockInResponse {
  message: string;
  clockInTime: string;
  timesheet: Timesheet;
}

export interface ClockOutResponse {
  message: string;
  clockOutTime: string;
  hoursWorked: number;
  finalCalculatedPay: string;
  timesheet: Timesheet;
}

export interface ApproveTimesheetResponse {
  message: string;
  timesheet: Timesheet;
}

export interface DisputeTimesheetRequest {
  note?: string;
}

export interface DisputeTimesheetResponse {
  message: string;
  timesheet: Timesheet;
}
