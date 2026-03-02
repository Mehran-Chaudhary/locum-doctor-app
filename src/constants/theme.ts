import { Dimensions, Platform, TextStyle, ViewStyle } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Color Palette ────────────────────────────────────────────────────────────
export const Colors = {
  // Primary
  primary: '#1A6FEF',
  primaryLight: '#EBF3FF',
  primaryDark: '#0D47A1',
  primarySoft: '#E8F1FD',

  // Secondary (teal – medical accent)
  secondary: '#0891B2',
  secondaryLight: '#ECFEFF',

  // Gradient stops
  gradientStart: '#0B1A3B',
  gradientMid: '#0F2B5B',
  gradientEnd: '#1A6FEF',

  // Backgrounds
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  surfaceElevated: '#FFFFFF',
  inputBackground: '#F8FAFC',

  // Text
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  textLink: '#1A6FEF',
  textOnGradient: 'rgba(255,255,255,0.7)',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#1A6FEF',
  borderSubtle: '#EEF2F6',

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
  overlay: 'rgba(11, 26, 59, 0.6)',
  overlayLight: 'rgba(255,255,255,0.12)',

  // Misc
  divider: '#F1F5F9',
  skeleton: '#E2E8F0',
  disabled: '#CBD5E1',
  disabledBg: '#F1F5F9',

  // Role accent colors
  doctor: '#1A6FEF',
  hospital: '#0891B2',
  admin: '#7C3AED',

  // Decorative
  decorativeCircle: 'rgba(255,255,255,0.06)',
  decorativeCircleLight: 'rgba(255,255,255,0.03)',
  cardShadow: 'rgba(15, 23, 42, 0.08)',

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
  h1: { fontSize: 34, fontWeight: '800', lineHeight: 42, letterSpacing: -0.8 },
  h2: { fontSize: 26, fontWeight: '700', lineHeight: 34, letterSpacing: -0.4 },
  h3: { fontSize: 20, fontWeight: '700', lineHeight: 28, letterSpacing: -0.2 },
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMedium: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
  bodySemiBold: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmallMedium: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  bodySmallSemiBold: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  captionMedium: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '700', lineHeight: 24, letterSpacing: 0.3 },
  buttonSmall: { fontSize: 14, fontWeight: '600', lineHeight: 20, letterSpacing: 0.2 },
  overline: { fontSize: 11, fontWeight: '700', lineHeight: 16, letterSpacing: 1.5, textTransform: 'uppercase' },
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
  xs: 8,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 32,
  full: 9999,
};

// ─── Platform-aware Shadows ───────────────────────────────────────────────────
export const Shadows: Record<string, ViewStyle> = {
  sm: Platform.select({
    ios: { shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4 },
    android: { elevation: 2 },
    default: {},
  })!,
  md: Platform.select({
    ios: { shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12 },
    android: { elevation: 4 },
    default: {},
  })!,
  lg: Platform.select({
    ios: { shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 24 },
    android: { elevation: 8 },
    default: {},
  })!,
  xl: Platform.select({
    ios: { shadowColor: 'rgba(15, 23, 42, 0.15)', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 1, shadowRadius: 32 },
    android: { elevation: 12 },
    default: {},
  })!,
  colored: Platform.select({
    ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
    android: { elevation: 6 },
    default: {},
  })!,
};

// ─── Layout Constants ─────────────────────────────────────────────────────────
export const Layout = {
  window: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  screenPadding: 24,
  inputHeight: 56,
  buttonHeight: 56,
  buttonHeightSmall: 46,
  headerHeight: 56,
  tabBarHeight: Platform.select({ ios: 88, android: 64 }) ?? 64,
  avatarLg: 120,
  avatarMd: 64,
  avatarSm: 40,
  cardPadding: 24,
  isSmallDevice: SCREEN_WIDTH < 375,
};
