import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * API Base URL — auto-detects your dev machine's IP in development.
 *
 * Works on ALL environments automatically:
 *  - Physical device (Expo Go) → reads IP from Expo's debuggerHost
 *  - Android Emulator          → 10.0.2.2 fallback
 *  - iOS Simulator             → localhost fallback
 *
 * You NEVER need to hardcode an IP.
 */
const getBaseUrl = (): string => {
  if (__DEV__) {
    // Expo provides the dev machine's IP via debuggerHost (e.g. "192.168.1.13:8081")
    const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;

    if (debuggerHost) {
      const host = debuggerHost.split(':')[0]; // strip the port
      return `http://${host}:3000/api/v1`;
    }

    // Fallback for emulators
    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${host}:3000/api/v1`;
  }
  return 'https://your-domain.com/api/v1';
};

export const API_BASE_URL = getBaseUrl();

export const APP_CONFIG = {
  ACCESS_TOKEN_EXPIRY_MINUTES: 15,
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  OTP_LENGTH: 6,
  OTP_RESEND_COOLDOWN_SECONDS: 60,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  GEO_FENCE_RADIUS_KM: 0.5,
  CLOCK_IN_EARLY_MINUTES: 30,
  CLOCK_IN_LATE_HOURS: 2,
  AUTO_APPROVE_HOURS: 48,
  PLATFORM_COMMISSION_RATE: 0.1,
  BLIND_REVIEW_DAYS: 7,
} as const;

export const SECURE_STORE_KEYS = {
  REFRESH_TOKEN: 'locum_refresh_token',
} as const;
