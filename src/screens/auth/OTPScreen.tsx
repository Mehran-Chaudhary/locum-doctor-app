import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import OTPInput from '../../components/ui/OTPInput';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { getErrorMessage } from '../../utils/error';
import { APP_CONFIG } from '../../constants/config';
import { Colors, Typography, Spacing, Layout, BorderRadius, Shadows } from '../../constants/theme';

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OTPScreen() {
  const { user, isLoading, pendingDevOtp, verifyOtp, resendOtp, logout } = useAuthStore();

  const [cooldown, setCooldown] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Entry animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 6 }),
    ]).start();

    // Pulse animation on shield icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  // Start cooldown timer on mount
  useEffect(() => {
    setCooldown(APP_CONFIG.OTP_RESEND_COOLDOWN_SECONDS);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((v) => v - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Show dev OTP on mount
  useEffect(() => {
    if (__DEV__ && pendingDevOtp) {
      Toast.show({
        type: 'dev',
        text1: 'Dev OTP',
        text2: pendingDevOtp,
        visibilityTime: 10000,
        position: 'top',
      });
    }
  }, [pendingDevOtp]);

  const handleVerify = useCallback(
    async (code: string) => {
      try {
        await verifyOtp(code);
        Toast.show({ type: 'success', text1: 'Verified!', text2: 'Phone number verified successfully.' });
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Verification Failed', text2: getErrorMessage(error) });
      }
    },
    [verifyOtp],
  );

  const handleResend = async () => {
    try {
      await resendOtp();
      setCooldown(APP_CONFIG.OTP_RESEND_COOLDOWN_SECONDS);
      Toast.show({ type: 'success', text1: 'OTP Sent', text2: 'Check your phone for the new code.' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Resend Failed', text2: getErrorMessage(error) });
    }
  };

  // Mask phone: +923001234567 → +92300***4567
  const maskedPhone = user?.phone
    ? user.phone.slice(0, 6) + '***' + user.phone.slice(-4)
    : '';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gradient background */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBg}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />
      </LinearGradient>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Icon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <Ionicons name="shield-checkmark" size={36} color={Colors.primary} />
            </View>
          </View>
        </Animated.View>

        {/* Title */}
        <Text style={[Typography.h2, styles.title]}>Verify Your Phone</Text>
        <Text style={[Typography.bodySmall, styles.subtitle]}>
          We sent a {APP_CONFIG.OTP_LENGTH}-digit code to{'\n'}
          <Text style={[Typography.bodySmallSemiBold, { color: Colors.textInverse }]}>
            {maskedPhone}
          </Text>
        </Text>

        {/* OTP Card */}
        <View style={[styles.otpCard, Shadows.xl]}>
          <Text style={[Typography.overline, styles.otpLabel]}>ENTER CODE</Text>
          <OTPInput length={APP_CONFIG.OTP_LENGTH} onComplete={handleVerify} />

          {/* Resend Row */}
          <View style={styles.resendRow}>
            {cooldown > 0 ? (
              <View style={styles.cooldownRow}>
                <Ionicons name="time-outline" size={16} color={Colors.textTertiary} />
                <Text style={[Typography.bodySmall, { color: Colors.textTertiary, marginLeft: 6 }]}>
                  Resend code in{' '}
                  <Text style={{ color: Colors.text, fontWeight: '700' }}>
                    {cooldown}s
                  </Text>
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={isLoading} style={styles.resendBtn}>
                <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
                <Text style={[Typography.bodySmallSemiBold, { color: Colors.primary, marginLeft: 6 }]}>
                  Resend OTP
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <View style={styles.logoutInner}>
            <Ionicons name="log-out-outline" size={18} color="rgba(255,255,255,0.6)" />
            <Text style={[Typography.bodySmall, { color: 'rgba(255,255,255,0.6)', marginLeft: 8 }]}>
              Sign out
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.decorativeCircle,
    top: -60,
    right: -80,
  },
  decorCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.decorativeCircleLight,
    bottom: 100,
    left: -60,
  },
  decorCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.decorativeCircle,
    bottom: -20,
    right: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  // Icon
  iconContainer: { marginBottom: Spacing.xxl },
  iconOuter: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  // Text
  title: { color: Colors.textInverse, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: {
    color: Colors.textOnGradient,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxxl,
  },
  // OTP Card
  otpCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
    width: '100%',
    alignItems: 'center',
  },
  otpLabel: {
    color: Colors.textTertiary,
    marginBottom: Spacing.xl,
  },
  // Resend
  resendRow: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
  cooldownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.full,
  },
  // Logout
  logoutBtn: {
    marginTop: Spacing.xxxl,
  },
  logoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
