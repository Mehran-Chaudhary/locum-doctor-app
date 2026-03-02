import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
    ]).start();
  }, []);

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
  const RoleCard = ({ role, icon, color, label }: { role: RoleOption; icon: string; color: string; label: string }) => {
    const selected = selectedRole === role;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 50 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
      ]).start();
      setValue('role', role, { shouldValidate: true });
    };

    return (
      <Animated.View style={[styles.roleCardWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={[
            styles.roleCard,
            selected
              ? { borderColor: color, backgroundColor: color + '08' }
              : { borderColor: Colors.borderSubtle, backgroundColor: Colors.surface },
            selected && Shadows.md,
          ]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          {selected && (
            <LinearGradient
              colors={[color + '15', color + '05']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          <View style={[styles.roleIconCircle, { backgroundColor: selected ? color + '18' : Colors.inputBackground }]}>
            <Ionicons name={icon as any} size={28} color={selected ? color : Colors.textTertiary} />
          </View>
          <Text style={[Typography.bodySemiBold, { color: selected ? color : Colors.textSecondary, marginTop: Spacing.sm }]}>
            {label}
          </Text>
          <Text style={[Typography.caption, { color: selected ? color + 'AA' : Colors.textTertiary, marginTop: 2 }]}>
            {role === 'DOCTOR' ? 'Find shifts' : 'Post shifts'}
          </Text>
          {selected && (
            <View style={[styles.checkBadge, { backgroundColor: color }]}>
              <Ionicons name="checkmark" size={14} color={Colors.textInverse} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Gradient Header Strip */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textInverse} />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={[Typography.h2, styles.headerTitle]}>Create Account</Text>
            <Text style={[Typography.bodySmall, styles.headerSubtitle]}>
              Join Pakistan's locum doctor network
            </Text>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* ── Role Picker ──────────────────────────────────────────────── */}
            <Text style={[Typography.bodySmallSemiBold, styles.sectionLabel]}>
              I am a
            </Text>
            <View style={styles.roleRow}>
              <RoleCard role="DOCTOR" icon="medical-outline" color={Colors.doctor} label="Doctor" />
              <RoleCard role="HOSPITAL" icon="business-outline" color={Colors.hospital} label="Hospital" />
            </View>
            {errors.role && (
              <Text style={[Typography.caption, styles.roleError]}>
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
              rightIcon="arrow-forward"
              style={{ marginTop: Spacing.md }}
            />

            {/* Bottom Link */}
            <View style={styles.bottomRow}>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={[Typography.bodySemiBold, { color: Colors.primary }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
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
  // ── Header Gradient ──
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Layout.screenPadding,
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.decorativeCircle,
    top: -30,
    right: -30,
  },
  decorCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.decorativeCircleLight,
    bottom: -10,
    left: 20,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  headerTextContainer: {
    zIndex: 1,
  },
  headerTitle: { color: Colors.textInverse, marginBottom: Spacing.xs },
  headerSubtitle: { color: Colors.textOnGradient },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxxl,
  },
  // ── Role picker ──
  sectionLabel: {
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: Spacing.xxl,
  },
  roleCardWrapper: {
    flex: 1,
  },
  roleCard: {
    paddingVertical: Spacing.xl,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  roleIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleError: {
    color: Colors.error,
    marginTop: -Spacing.lg,
    marginBottom: Spacing.md,
  },
  // ── Bottom ──
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
});
