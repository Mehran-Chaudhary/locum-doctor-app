import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { getErrorMessage } from '../../utils/error';
import { Colors, Typography, Spacing, Layout, Shadows, BorderRadius } from '../../constants/theme';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ─── Validation ───────────────────────────────────────────────────────────────
const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ForgotPasswordScreen({ navigation }: NativeStackScreenProps<any>) {
  const { forgotPassword, isLoading } = useAuthStore();
  const [sent, setSent] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
    ]).start();
  }, []);

  const { control, handleSubmit, formState: { errors }, getValues } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const devToken = await forgotPassword(values.email);
      setSent(true);
      Toast.show({ type: 'success', text1: 'Email Sent', text2: 'Check your email for the reset link.' });

      if (__DEV__ && devToken) {
        Toast.show({
          type: 'dev',
          text1: 'Dev Reset Token',
          text2: devToken,
          visibilityTime: 15000,
          position: 'top',
        });
        setTimeout(() => {
          navigation.navigate('ResetPassword', { devResetToken: devToken });
        }, 1000);
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(error) });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.decorCircle1} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textInverse} />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, Shadows.lg]}>
                <Ionicons name={sent ? 'checkmark-circle' : 'mail-unread-outline'} size={34} color={sent ? Colors.success : Colors.primary} />
              </View>
            </View>

            <Text style={[Typography.h2, styles.heading]}>{sent ? 'Check Your Email' : 'Reset Password'}</Text>
            <Text style={[Typography.bodySmall, styles.subheading]}>
              {sent
                ? `We've sent reset instructions to`
                : 'Enter your email and we\'ll send you instructions to reset your password.'}
            </Text>
            {sent && (
              <Text style={[Typography.bodySmallSemiBold, styles.emailHighlight]}>
                {getValues('email')}
              </Text>
            )}

            {!sent ? (
              <View style={[styles.formCard, Shadows.md]}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Email Address"
                      value={value}
                      onChangeText={onChange}
                      error={errors.email?.message}
                      leftIcon="mail-outline"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="you@example.com"
                    />
                  )}
                />

                <Button
                  label="Send Reset Link"
                  onPress={handleSubmit(onSubmit)}
                  loading={isLoading}
                  fullWidth
                  rightIcon="arrow-forward"
                />
              </View>
            ) : (
              <View style={[styles.sentCard, Shadows.md]}>
                <View style={styles.sentIconRow}>
                  <View style={[styles.sentStep, { backgroundColor: Colors.successLight }]}>
                    <Ionicons name="mail" size={20} color={Colors.success} />
                  </View>
                  <View style={styles.sentStepLine} />
                  <View style={[styles.sentStep, { backgroundColor: Colors.primarySoft }]}>
                    <Ionicons name="key" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.sentStepLine} />
                  <View style={[styles.sentStep, { backgroundColor: Colors.inputBackground }]}>
                    <Ionicons name="lock-open" size={20} color={Colors.textTertiary} />
                  </View>
                </View>

                <Text style={[Typography.bodySmall, styles.sentHint]}>
                  Check your inbox (and spam folder) for the reset email.
                </Text>

                <Button
                  label="Go to Reset Password"
                  onPress={() => navigation.navigate('ResetPassword')}
                  variant="outline"
                  fullWidth
                  rightIcon="arrow-forward"
                  style={{ marginTop: Spacing.xl }}
                />
              </View>
            )}

            {/* Back to login */}
            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="arrow-back" size={16} color={Colors.primary} />
              <Text style={[Typography.bodySmallSemiBold, { color: Colors.primary, marginLeft: 8 }]}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Layout.screenPadding,
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.decorativeCircle,
    top: -20,
    right: -20,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxxxl,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    marginBottom: Spacing.xxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  subheading: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  emailHighlight: {
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  // Form card
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    marginTop: Spacing.xxl,
  },
  // Sent state
  sentCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  sentIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  sentStep: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentStepLine: {
    width: 24,
    height: 2,
    backgroundColor: Colors.borderSubtle,
    marginHorizontal: 4,
  },
  sentHint: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Back link
  backToLogin: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    paddingVertical: Spacing.sm,
  },
});
