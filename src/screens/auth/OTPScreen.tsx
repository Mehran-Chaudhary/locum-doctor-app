import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import OTPInput from '../../components/ui/OTPInput';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { getErrorMessage } from '../../utils/error';
import { APP_CONFIG } from '../../constants/config';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../constants/theme';

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OTPScreen() {
  const { user, isLoading, pendingDevOtp, verifyOtp, resendOtp, logout } = useAuthStore();

  const [cooldown, setCooldown] = useState(0);

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
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <Ionicons name="shield-checkmark" size={40} color={Colors.primary} />
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={[Typography.h2, styles.title]}>Verify Your Phone</Text>
        <Text style={[Typography.bodySmall, styles.subtitle]}>
          We sent a {APP_CONFIG.OTP_LENGTH}-digit code to{'\n'}
          <Text style={[Typography.bodySmallMedium, { color: Colors.text }]}>
            {maskedPhone}
          </Text>
        </Text>

        {/* OTP Input */}
        <View style={styles.otpSection}>
          <OTPInput length={APP_CONFIG.OTP_LENGTH} onComplete={handleVerify} />
        </View>

        {/* Resend Row */}
        <View style={styles.resendRow}>
          {cooldown > 0 ? (
            <Text style={[Typography.bodySmall, { color: Colors.textTertiary }]}>
              Resend code in{' '}
              <Text style={{ color: Colors.text, fontWeight: '600' }}>
                {cooldown}s
              </Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={isLoading}>
              <Text style={[Typography.bodySmallSemiBold, { color: Colors.primary }]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.textSecondary} />
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginLeft: 6 }]}>
            Sign out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Icon
  iconContainer: { marginBottom: Spacing.xxl },
  iconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Text
  title: { color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxxl,
  },
  // OTP
  otpSection: {
    width: '100%',
    alignItems: 'center',
  },
  // Resend
  resendRow: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xxxxl,
    paddingVertical: Spacing.sm,
  },
});
