import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../stores/auth.store';
import { Role, AccountStatus } from '../constants/enums';
import { Colors, Typography, Spacing } from '../constants/theme';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Onboarding screens
import DoctorProfileScreen from '../screens/onboarding/DoctorProfileScreen';
import HospitalProfileScreen from '../screens/onboarding/HospitalProfileScreen';
import PendingVerificationScreen from '../screens/onboarding/PendingVerificationScreen';
import AccountStatusScreen from '../screens/onboarding/AccountStatusScreen';

// Main app tab navigators
import DoctorTabs from '../screens/doctor/DoctorTabs';
import HospitalTabs from '../screens/hospital/HospitalTabs';
import AdminTabs from '../screens/admin/AdminTabs';

const Stack = createNativeStackNavigator();

// ─── Splash / Bootstrap ───────────────────────────────────────────────────────
function SplashView() {
  return (
    <View style={styles.splash}>
      <View style={styles.splashLogo}>
        <Ionicons name="medical" size={48} color={Colors.primary} />
      </View>
      <Text style={[Typography.h2, { color: Colors.text, marginTop: Spacing.lg }]}>LocumDoc</Text>
      <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xxxl }} />
    </View>
  );
}

// ─── Role-based main app ──────────────────────────────────────────────────────
function AppTabs() {
  const { user } = useAuthStore();

  switch (user?.role) {
    case Role.DOCTOR:
      return <DoctorTabs />;
    case Role.HOSPITAL:
      return <HospitalTabs />;
    case Role.SUPER_ADMIN:
      return <AdminTabs />;
    default:
      return null;
  }
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function RootNavigator() {
  const { user, isInitialized } = useAuthStore();

  // Still bootstrapping
  if (!isInitialized) {
    return <SplashView />;
  }

  // Determine which sub-state we're in
  const hasProfile =
    user?.role === Role.DOCTOR
      ? !!user?.doctorProfile
      : user?.role === Role.HOSPITAL
        ? !!user?.hospitalProfile
        : true; // Admin doesn't need an onboarding profile

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!user ? (
        // ── 1. Auth Flow ──────────────────────────────────────────────────
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ animation: 'slide_from_right' }} />
        </>
      ) : !user.phoneVerified ? (
        // ── 2. OTP Verification ───────────────────────────────────────────
        <Stack.Screen name="OTP" component={OTPScreen} />
      ) : !hasProfile ? (
        // ── 3. Onboarding ─────────────────────────────────────────────────
        <Stack.Screen
          name="CreateProfile"
          component={user.role === Role.DOCTOR ? DoctorProfileScreen : HospitalProfileScreen}
        />
      ) : user.status === AccountStatus.PENDING_VERIFICATION ? (
        // ── 4. Pending Verification ───────────────────────────────────────
        <Stack.Screen name="PendingVerification" component={PendingVerificationScreen} />
      ) : user.status === AccountStatus.REJECTED || user.status === AccountStatus.SUSPENDED ? (
        // ── 5. Account Issues ─────────────────────────────────────────────
        <Stack.Screen name="AccountStatus" component={AccountStatusScreen} />
      ) : (
        // ── 6. Verified → Main App ────────────────────────────────────────
        <Stack.Screen name="MainApp" component={AppTabs} />
      )}
    </Stack.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
