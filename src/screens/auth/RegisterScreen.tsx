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
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ─── Validation ───────────────────────────────────────────────────────────────
const schema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    phone: z
      .string()
      .min(1, 'Phone is required')
      .regex(/^\+923\d{9}$/, 'Format: +923XXXXXXXXX'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include one uppercase letter')
      .regex(/[0-9]/, 'Include one number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    role: z.enum(['DOCTOR', 'HOSPITAL'], { message: 'Select a role' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;
type RoleOption = 'DOCTOR' | 'HOSPITAL';

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }: NativeStackScreenProps<any>) {
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', phone: '+92', password: '', confirmPassword: '', role: undefined as any },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser({
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: values.role,
      });
      Toast.show({ type: 'success', text1: 'Account Created', text2: 'Please verify your phone number.' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Registration Failed', text2: getErrorMessage(error) });
    }
  };

  // ── Role Card ─────────────────────────────────────────────────────────────
  const RoleCard = ({ role, icon, color }: { role: RoleOption; icon: string; color: string }) => {
    const selected = selectedRole === role;
    return (
      <TouchableOpacity
        style={[
          styles.roleCard,
          selected
            ? { borderColor: color, backgroundColor: color + '10' }
            : { borderColor: Colors.border, backgroundColor: Colors.surface },
        ]}
        onPress={() => setValue('role', role, { shouldValidate: true })}
        activeOpacity={0.7}
      >
        <View style={[styles.roleIconCircle, { backgroundColor: selected ? color + '18' : Colors.surfaceSecondary }]}>
          <Ionicons name={icon as any} size={32} color={selected ? color : Colors.textTertiary} />
        </View>
        <Text style={[Typography.bodySemiBold, { color: selected ? color : Colors.textSecondary, marginTop: Spacing.sm }]}>
          {role === 'DOCTOR' ? 'Doctor' : 'Hospital'}
        </Text>
        {selected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark-circle" size={20} color={color} />
          </View>
        )}
      </TouchableOpacity>
    );
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
          <Text style={[Typography.h2, styles.heading]}>Create Account</Text>
          <Text style={[Typography.bodySmall, styles.subheading]}>
            Join Pakistan's locum doctor network
          </Text>

          {/* ── Role Picker ──────────────────────────────────────────────── */}
          <Text style={[Typography.bodySmallMedium, { color: Colors.text, marginBottom: Spacing.sm }]}>
            I am a
          </Text>
          <View style={styles.roleRow}>
            <RoleCard role="DOCTOR" icon="medical-outline" color={Colors.doctor} />
            <RoleCard role="HOSPITAL" icon="business-outline" color={Colors.hospital} />
          </View>
          {errors.role && (
            <Text style={[Typography.caption, { color: Colors.error, marginTop: -Spacing.sm, marginBottom: Spacing.md }]}>
              {errors.role.message}
            </Text>
          )}

          {/* ── Fields ───────────────────────────────────────────────────── */}
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
            name="phone"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Phone Number"
                value={value}
                onChangeText={onChange}
                error={errors.phone?.message}
                leftIcon="call-outline"
                keyboardType="phone-pad"
                placeholder="+923001234567"
                maxLength={13}
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

          {/* Register Button */}
          <Button
            label="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />

          {/* Bottom Link */}
          <View style={styles.bottomRow}>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[Typography.bodySmallSemiBold, { color: Colors.primary }]}>
                Sign In
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
  heading: { color: Colors.text, marginBottom: Spacing.xs },
  subheading: { color: Colors.textSecondary, marginBottom: Spacing.xxl },
  // Role picker
  roleRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: Spacing.xxl,
  },
  roleCard: {
    flex: 1,
    paddingVertical: Spacing.xl,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    position: 'relative',
  },
  roleIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  // Bottom
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
});
