import { Platform } from 'react-native';

/**
 * API Base URL
 *
 * Android Emulator → 10.0.2.2 maps to host machine's localhost
 * iOS Simulator   → localhost works directly
 * Physical device → use your machine's LAN IP (e.g. 192.168.x.x)
 */
const getBaseUrl = (): string => {
  if (__DEV__) {
    // Change this to your machine's IP if testing on a physical device
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
