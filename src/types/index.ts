import type { Role, AccountStatus, Specialty } from '../constants/enums';

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
