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
const schema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include one uppercase letter')
      .regex(/[0-9]/, 'Include one number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ResetPasswordScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { resetPassword, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  const devToken = (route.params as any)?.devResetToken ?? '';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
    ]).start();
  }, []);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: devToken, newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await resetPassword(values.token, values.newPassword);
      setSuccess(true);
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 10 }).start();
      Toast.show({ type: 'success', text1: 'Password Reset', text2: 'You can now sign in with your new password.' });
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
                <Ionicons name={success ? 'checkmark-circle' : 'key-outline'} size={34} color={success ? Colors.success : Colors.primary} />
              </View>
            </View>

            <Text style={[Typography.h2, styles.heading]}>
              {success ? 'All Done!' : 'New Password'}
            </Text>
            <Text style={[Typography.bodySmall, styles.subheading]}>
              {success
                ? 'Your password has been reset successfully.'
                : 'Enter the reset token from your email and create a new password.'}
            </Text>

            {!success ? (
              <View style={[styles.formCard, Shadows.md]}>
                <Controller
                  control={control}
                  name="token"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Reset Token"
                      value={value}
                      onChangeText={onChange}
                      error={errors.token?.message}
                      leftIcon="key-outline"
                      autoCapitalize="none"
                      placeholder="Paste token from email"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="newPassword"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="New Password"
                      value={value}
                      onChangeText={onChange}
                      error={errors.newPassword?.message}
                      leftIcon="lock-closed-outline"
                      secureTextEntry={!showPassword}
                      rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      onRightIconPress={() => setShowPassword((p) => !p)}
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Confirm Password"
                      value={value}
                      onChangeText={onChange}
                      error={errors.confirmPassword?.message}
                      leftIcon="lock-closed-outline"
                      secureTextEntry={!showConfirm}
                      rightIcon={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      onRightIconPress={() => setShowConfirm((p) => !p)}
                      placeholder="Re-enter your password"
                    />
                  )}
                />

                <Button
                  label="Reset Password"
                  onPress={handleSubmit(onSubmit)}
                  loading={isLoading}
                  fullWidth
                  rightIcon="arrow-forward"
                />
              </View>
            ) : (
              <Animated.View style={[styles.successCard, Shadows.md, { transform: [{ scale: successScale }] }]}>
                <View style={styles.successIconBg}>
                  <Ionicons name="shield-checkmark" size={48} color={Colors.success} />
                </View>
                <Text style={[Typography.bodyMedium, styles.successText]}>
                  You can now sign in with your new password.
                </Text>
                <Button
                  label="Go to Sign In"
                  onPress={() => navigation.navigate('Login')}
                  fullWidth
                  rightIcon="arrow-forward"
                  style={{ marginTop: Spacing.xxl }}
                />
              </Animated.View>
            )}
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
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
  },
  successCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    alignItems: 'center',
  },
  successIconBg: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
