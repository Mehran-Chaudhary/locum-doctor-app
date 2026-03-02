import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../constants/theme';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ─── Validation ───────────────────────────────────────────────────────────────
const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }: NativeStackScreenProps<any>) {
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password);
      // Navigation is handled by RootNavigator reacting to auth state
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Login Failed', text2: getErrorMessage(error) });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand ──────────────────────────────────────────────────────── */}
          <View style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="medical" size={40} color={Colors.primary} />
            </View>
            <Text style={[Typography.h2, styles.brandName]}>LocumDoc</Text>
            <Text style={[Typography.bodySmall, styles.brandTagline]}>
              Pakistan's Locum Doctor Platform
            </Text>
          </View>

          {/* ── Form Card ──────────────────────────────────────────────────── */}
          <View style={styles.formSection}>
            <Text style={[Typography.h2, styles.heading]}>Welcome Back</Text>
            <Text style={[Typography.bodySmall, styles.subheading]}>
              Sign in to continue
            </Text>

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
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                  leftIcon="lock-closed-outline"
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onRightIconPress={() => setShowPassword((p) => !p)}
                  placeholder="Enter your password"
                />
              )}
            />

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={[Typography.bodySmallMedium, { color: Colors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              fullWidth
              style={{ marginTop: Spacing.sm }}
            />
          </View>

          {/* ── Bottom Link ────────────────────────────────────────────────── */}
          <View style={styles.bottomRow}>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[Typography.bodySmallSemiBold, { color: Colors.primary }]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPadding,
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  // Brand
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: Colors.text,
    marginTop: Spacing.md,
  },
  brandTagline: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  // Form
  formSection: {
    marginBottom: Spacing.xxl,
  },
  heading: {
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subheading: {
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
  },
  // Bottom
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
