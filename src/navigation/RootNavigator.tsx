import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
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
import AccountStatusScreen from '../screens/onboarding/AccountStatusScreen';

// Guest browsing
import ShiftFeedScreen from '../screens/doctor/ShiftFeedScreen';
import ShiftDetailScreen from '../screens/doctor/ShiftDetailScreen';

// Main app tab navigators
import DoctorTabs from '../screens/doctor/DoctorTabs';
import HospitalTabs from '../screens/hospital/HospitalTabs';
import AdminTabs from '../screens/admin/AdminTabs';

const Stack = createNativeStackNavigator();
const GuestTab = createBottomTabNavigator();
const GuestShiftsStack = createNativeStackNavigator();

// ─── Splash / Bootstrap ───────────────────────────────────────────────────────
function SplashView() {
  return (
    <View style={styles.splash}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.splashDecor1} />
      <View style={styles.splashDecor2} />
      <View style={styles.splashLogo}>
        <Ionicons name="medical" size={44} color={Colors.primary} />
      </View>
      <Text style={[Typography.h1, { color: Colors.textInverse, marginTop: Spacing.lg }]}>LocumDoc</Text>
      <Text style={[Typography.bodySmall, { color: 'rgba(255,255,255,0.65)', marginTop: Spacing.xs }]}>
        Find your next shift
      </Text>
      <ActivityIndicator size="large" color="rgba(255,255,255,0.8)" style={{ marginTop: Spacing.xxxl }} />
    </View>
  );
}

// ─── Guest: Shifts browsing stack ─────────────────────────────────────────────
function GuestShiftsStackNavigator() {
  return (
    <GuestShiftsStack.Navigator screenOptions={{ headerShown: false }}>
      <GuestShiftsStack.Screen name="ShiftFeed" component={ShiftFeedScreen} />
      <GuestShiftsStack.Screen name="ShiftDetail" component={ShiftDetailScreen} />
    </GuestShiftsStack.Navigator>
  );
}

// ─── Guest: Tab navigator (browse shifts + login prompt) ──────────────────────
function GuestTabs() {
  return (
    <GuestTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: { ...Typography.caption, marginTop: -2 },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
          paddingBottom: 4,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Shifts: 'briefcase-outline',
            Login: 'log-in-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <GuestTab.Screen name="Shifts" component={GuestShiftsStackNavigator} />
      <GuestTab.Screen name="Login" component={LoginScreen} />
    </GuestTab.Navigator>
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

  // If a user has reached VERIFIED, REJECTED, or SUSPENDED status, they
  // already submitted a profile (admin processed it). Trust the status even
  // if the profile relation wasn't included in the login response.
  const statusImpliesProfile =
    user?.status === AccountStatus.VERIFIED ||
    user?.status === AccountStatus.REJECTED ||
    user?.status === AccountStatus.SUSPENDED;

  const hasProfile =
    statusImpliesProfile
      ? true
      : user?.role === Role.DOCTOR
        ? !!user?.doctorProfile
        : user?.role === Role.HOSPITAL
          ? !!user?.hospitalProfile
          : true;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!user ? (
        // ── 1. Guest: Browse shifts freely, login tab available ────────────
        <>
          <Stack.Screen name="GuestTabs" component={GuestTabs} />
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
      ) : user.status === AccountStatus.REJECTED || user.status === AccountStatus.SUSPENDED ? (
        // ── 4. Account Issues (REJECTED / SUSPENDED only) ─────────────────
        <Stack.Screen name="AccountStatus" component={AccountStatusScreen} />
      ) : (
        // ── 5. Main App (VERIFIED *and* PENDING_VERIFICATION) ─────────────
        //    Pending users can browse but action buttons are gated in screens
        <Stack.Screen name="MainApp" component={AppTabs} />
      )}
    </Stack.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashDecor1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -50,
    right: -50,
  },
  splashDecor2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 80,
    left: -30,
  },
  splashLogo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
});
