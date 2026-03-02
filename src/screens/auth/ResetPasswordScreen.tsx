import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { getErrorMessage } from '../../utils/error';
import { Colors, Typography, Spacing, Layout, Shadows } from '../../constants/theme';

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

  const devToken = (route.params as any)?.devResetToken ?? '';

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: devToken, newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await resetPassword(values.token, values.newPassword);
      setSuccess(true);
      Toast.show({ type: 'success', text1: 'Password Reset', text2: 'You can now sign in with your new password.' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(error) });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="key-outline" size={36} color={Colors.primary} />
            </View>
          </View>

          <Text style={[Typography.h2, styles.heading]}>New Password</Text>
          <Text style={[Typography.bodySmall, styles.subheading]}>
            Enter the reset token from your email and create a new password.
          </Text>

          {!success ? (
            <>
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
                style={{ marginTop: Spacing.sm }}
              />
            </>
          ) : (
            <View style={styles.successCard}>
              <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
              <Text style={[Typography.h3, { color: Colors.text, marginTop: Spacing.lg }]}>
                All Done!
              </Text>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }]}>
                Your password has been reset successfully. You can now sign in.
              </Text>
              <Button
                label="Go to Sign In"
                onPress={() => navigation.navigate('Login')}
                fullWidth
                style={{ marginTop: Spacing.xxxl }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    height: Layout.headerHeight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxxl,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  subheading: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxxl,
  },
});
