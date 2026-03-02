import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { setAccessToken, setLogoutCallback } from '../services/api';
import { authService } from '../services/auth.service';
import { SECURE_STORE_KEYS } from '../constants/config';
import type { User, RegisterRequest } from '../types';

// ─── State Shape ──────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  /** Dev only — OTP returned from backend for testing. */
  pendingDevOtp: string | null;

  /** Bootstrap: read refresh token from SecureStore & rehydrate session. */
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string | undefined>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  /** Re-fetch /auth/me to refresh local user data (e.g. after profile creation). */
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set, get) => {
  // Wire up force-logout callback for the API interceptor
  setLogoutCallback(() => {
    const { logout } = get();
    logout();
  });

  return {
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,
    pendingDevOtp: null,

    // ── Initialize ──────────────────────────────────────────────────────────
    initialize: async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          set({ isInitialized: true });
          return;
        }

        const result = await authService.refreshTokens(refreshToken);
        const { tokens } = result;

        setAccessToken(tokens.accessToken);
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, tokens.refreshToken);

        // Refresh endpoint only returns tokens, so fetch user data separately
        const user = await authService.getMe();

        set({ user, accessToken: tokens.accessToken, isInitialized: true });
      } catch {
        // Token invalid / expired — start fresh
        await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
        setAccessToken(null);
        set({ user: null, accessToken: null, isInitialized: true });
      }
    },

    // ── Login ───────────────────────────────────────────────────────────────
    login: async (email, password) => {
      set({ isLoading: true });
      try {
        const result = await authService.login({ email, password });
        setAccessToken(result.tokens.accessToken);
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, result.tokens.refreshToken);
        set({ user: result.user, accessToken: result.tokens.accessToken, isLoading: false });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    // ── Register ────────────────────────────────────────────────────────────
    register: async (body) => {
      set({ isLoading: true });
      try {
        const result = await authService.register(body);
        setAccessToken(result.tokens.accessToken);
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, result.tokens.refreshToken);
        set({
          user: result.user,
          accessToken: result.tokens.accessToken,
          isLoading: false,
          pendingDevOtp: result.devOtp ?? null,
        });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    // ── Verify OTP ──────────────────────────────────────────────────────────
    verifyOtp: async (code) => {
      set({ isLoading: true });
      try {
        await authService.verifyOtp(code);
        // Refresh user to get updated phoneVerified
        const user = await authService.getMe();
        set({ user, isLoading: false, pendingDevOtp: null });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    // ── Resend OTP ──────────────────────────────────────────────────────────
    resendOtp: async () => {
      set({ isLoading: true });
      try {
        const result = await authService.resendOtp();
        set({ isLoading: false, pendingDevOtp: result.devOtp ?? null });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    // ── Forgot Password ─────────────────────────────────────────────────────
    forgotPassword: async (email) => {
      set({ isLoading: true });
      try {
        const result = await authService.forgotPassword({ email });
        set({ isLoading: false });
        return result.devResetToken;
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    // ── Reset Password ──────────────────────────────────────────────────────
    resetPassword: async (token, newPassword) => {
      set({ isLoading: true });
      try {
        await authService.resetPassword({ token, newPassword });
        set({ isLoading: false });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    // ── Refresh User ────────────────────────────────────────────────────────
    refreshUser: async () => {
      try {
        const user = await authService.getMe();
        set({ user });
      } catch {
        // silent
      }
    },

    // ── Logout ──────────────────────────────────────────────────────────────
    logout: async () => {
      // Invalidate refresh token server-side (best-effort, don't block on failure)
      try {
        await authService.logout();
      } catch {
        // silent — even if the server call fails, we still clear local state
      }
      setAccessToken(null);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
      set({ user: null, accessToken: null, pendingDevOtp: null });
    },

    // ── Set User ────────────────────────────────────────────────────────────
    setUser: (user) => set({ user }),
  };
});
