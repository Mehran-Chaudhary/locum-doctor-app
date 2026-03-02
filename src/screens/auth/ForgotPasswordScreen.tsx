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
        // Auto-navigate to reset screen with token in dev
        setTimeout(() => {
          navigation.navigate('ResetPassword', { devResetToken: devToken });
        }, 1000);
      }
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
              <Ionicons name="mail-unread-outline" size={36} color={Colors.primary} />
            </View>
          </View>

          <Text style={[Typography.h2, styles.heading]}>Reset Password</Text>
          <Text style={[Typography.bodySmall, styles.subheading]}>
            Enter your email and we'll send you instructions to reset your password.
          </Text>

          {!sent ? (
            <>
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
                style={{ marginTop: Spacing.sm }}
              />
            </>
          ) : (
            <View style={styles.sentCard}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
              <Text style={[Typography.bodyMedium, { color: Colors.text, marginTop: Spacing.md, textAlign: 'center' }]}>
                Email sent to{'\n'}
                <Text style={{ fontWeight: '700' }}>{getValues('email')}</Text>
              </Text>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }]}>
                Check your inbox (and spam folder).
              </Text>

              <Button
                label="Go to Reset Password"
                onPress={() => navigation.navigate('ResetPassword')}
                variant="outline"
                fullWidth
                style={{ marginTop: Spacing.xxl }}
              />
            </View>
          )}

          {/* Back to login */}
          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.primary} />
            <Text style={[Typography.bodySmallMedium, { color: Colors.primary, marginLeft: 6 }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
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
    marginTop: Spacing.xxxxl,
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
  sentCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  backToLogin: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxxl,
  },
});
