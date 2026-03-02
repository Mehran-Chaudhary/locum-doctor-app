import api from './api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResendOtpResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  User,
} from '../types';

const AUTH = '/auth';

export const authService = {
  register: async (body: RegisterRequest): Promise<RegisterResponse> => {
    const { data } = await api.post(`${AUTH}/register`, body);
    return data.data;
  },

  login: async (body: LoginRequest): Promise<LoginResponse> => {
    const { data } = await api.post(`${AUTH}/login`, body);
    return data.data;
  },

  verifyOtp: async (code: string): Promise<{ message: string }> => {
    const { data } = await api.post(`${AUTH}/verify-otp`, { code });
    return data.data;
  },

  resendOtp: async (): Promise<ResendOtpResponse> => {
    const { data } = await api.post(`${AUTH}/resend-otp`);
    return data.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const { data } = await api.post(`${AUTH}/logout`);
    return data.data;
  },

  forgotPassword: async (body: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const { data } = await api.post(`${AUTH}/forgot-password`, body);
    return data.data;
  },

  resetPassword: async (body: ResetPasswordRequest): Promise<{ message: string }> => {
    const { data } = await api.post(`${AUTH}/reset-password`, body);
    return data.data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get(`${AUTH}/me`);
    return data.data;
  },

  refreshTokens: async (refreshToken: string): Promise<{ message: string; tokens: { accessToken: string; refreshToken: string } }> => {
    const { data } = await api.post(`${AUTH}/refresh`, { refreshToken });
    return data.data;
  },
};
