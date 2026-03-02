import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Linking, Animated, Easing, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { Colors, Typography, Spacing, Layout, BorderRadius, Shadows } from '../../constants/theme';
import { AccountStatus } from '../../constants/enums';

// ─── Config per status ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  gradientColors: [string, string, string];
  title: string;
  description: string;
}> = {
  [AccountStatus.REJECTED]: {
    icon: 'close-circle',
    iconColor: '#FFFFFF',
    bgColor: Colors.statusRejectedLight,
    gradientColors: ['#991B1B', '#DC2626', '#EF4444'],
    title: 'Account Rejected',
    description:
      'Unfortunately, your profile was not approved. This may be due to incomplete documentation or mismatched credentials. Please contact our support team for more details.',
  },
  [AccountStatus.SUSPENDED]: {
    icon: 'ban',
    iconColor: '#FFFFFF',
    bgColor: Colors.statusSuspendedLight,
    gradientColors: ['#92400E', '#D97706', '#F59E0B'],
    title: 'Account Suspended',
    description:
      'Your account has been temporarily suspended. This could be due to a policy violation or pending investigation. Please contact support to resolve this issue.',
  },
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AccountStatusScreen() {
  const { user, logout, refreshUser, isLoading } = useAuthStore();

  const status = user?.status ?? AccountStatus.REJECTED;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[AccountStatus.REJECTED];

  // Entry animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 15, stiffness: 100, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, damping: 10, stiffness: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@locumdoc.pk?subject=Account%20Issue').catch(() => {});
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={config.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Decorative circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Icon */}
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconScale }] }]}>
            <View style={styles.iconOuter}>
              <Ionicons name={config.icon} size={52} color={config.iconColor} />
            </View>
          </Animated.View>

          {/* Text */}
          <Text style={[Typography.h1, styles.title]}>{config.title}</Text>
          <Text style={[Typography.body, styles.description]}>{config.description}</Text>

          {/* Floating Info Card */}
          <View style={[styles.infoCard, Shadows.xl]}>
            <View style={styles.infoRow}>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>Account</Text>
              <Text style={[Typography.bodySmallMedium, { color: Colors.text }]} numberOfLines={1}>{user?.email}</Text>
            </View>
            <View style={styles.infoSep} />
            <View style={styles.infoRow}>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
                <Text style={[Typography.captionMedium, { color: config.gradientColors[1] }]}>
                  {status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>

            <View style={styles.actionGroup}>
              <Button
                label="Contact Support"
                onPress={handleContactSupport}
                fullWidth
                leftIcon="mail-outline"
              />

              <Button
                label="Refresh Status"
                onPress={refreshUser}
                variant="outline"
                fullWidth
                loading={isLoading}
                leftIcon="refresh-outline"
                style={{ marginTop: Spacing.md }}
              />
            </View>
          </View>

          {/* Sign out – pill button */}
          <Button
            label="Sign Out"
            onPress={logout}
            variant="ghost"
            fullWidth
            leftIcon="log-out-outline"
            style={styles.signOutBtn}
            labelStyle={{ color: 'rgba(255,255,255,0.9)' }}
          />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -60,
  },
  decorCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 100,
    left: -50,
  },
  decorCircle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: '40%' as any,
    right: 20,
  },
  iconContainer: { marginBottom: Spacing.xxl },
  iconOuter: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Colors.textInverse, textAlign: 'center', marginBottom: Spacing.md },
  description: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xxl,
    lineHeight: 24,
  },
  // Info card
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Layout.cardPadding,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  infoSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  actionGroup: {
    marginTop: Spacing.xl,
  },
  signOutBtn: {
    marginTop: Spacing.xl,
  },
});
