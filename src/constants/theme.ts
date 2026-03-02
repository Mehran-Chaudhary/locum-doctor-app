import { Dimensions, Platform, TextStyle, ViewStyle } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Color Palette ────────────────────────────────────────────────────────────
export const Colors = {
  // Primary
  primary: '#1A6FEF',
  primaryLight: '#EBF3FF',
  primaryDark: '#0F4BA3',

  // Secondary (teal – medical accent)
  secondary: '#0891B2',
  secondaryLight: '#ECFEFF',

  // Backgrounds
  background: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',

  // Text
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  textLink: '#1A6FEF',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#1A6FEF',

  // Semantic
  success: '#10B981',
  successLight: '#ECFDF5',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  // Urgency
  urgent: '#EF4444',
  urgentLight: '#FEF2F2',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.5)',

  // Misc
  divider: '#F1F5F9',
  skeleton: '#E2E8F0',
  disabled: '#CBD5E1',
  disabledBg: '#F1F5F9',

  // Role accent colors
  doctor: '#1A6FEF',
  hospital: '#0891B2',
  admin: '#7C3AED',

  // Account status colors
  statusPending: '#F59E0B',
  statusPendingLight: '#FFFBEB',
  statusVerified: '#10B981',
  statusVerifiedLight: '#ECFDF5',
  statusRejected: '#EF4444',
  statusRejectedLight: '#FEF2F2',
  statusSuspended: '#7C3AED',
  statusSuspendedLight: '#F5F3FF',
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const Typography: Record<string, TextStyle> = {
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMedium: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
  bodySemiBold: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmallMedium: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  bodySmallSemiBold: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  captionMedium: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  buttonSmall: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
};

// ─── Spacing (4-pt grid) ─────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  section: 48,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const BorderRadius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ─── Platform-aware Shadows ───────────────────────────────────────────────────
export const Shadows: Record<string, ViewStyle> = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    android: { elevation: 1 },
    default: {},
  })!,
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  })!,
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16 },
    android: { elevation: 6 },
    default: {},
  })!,
};

// ─── Layout Constants ─────────────────────────────────────────────────────────
export const Layout = {
  window: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  screenPadding: 24,
  inputHeight: 52,
  buttonHeight: 52,
  buttonHeightSmall: 44,
  headerHeight: 56,
  tabBarHeight: Platform.select({ ios: 88, android: 64 }) ?? 64,
  avatarLg: 120,
  avatarMd: 64,
  avatarSm: 40,
  isSmallDevice: SCREEN_WIDTH < 375,
};
