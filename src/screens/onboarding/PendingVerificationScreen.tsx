import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import Button from '../../components/ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { Colors, Typography, Spacing, Layout, BorderRadius, Shadows } from '../../constants/theme';

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PendingVerificationScreen() {
  const { refreshUser, logout, isLoading } = useAuthStore();

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entry
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 15, stiffness: 100, useNativeDriver: true }),
    ]).start();

    // Pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleRefresh = async () => {
    await refreshUser();
    Toast.show({ type: 'info', text1: 'Status Checked', text2: 'Your profile is still under review.' });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
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
          {/* Animated Icon */}
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.iconOuter}>
              <Ionicons name="hourglass-outline" size={52} color="#FFFFFF" />
            </View>
          </Animated.View>

          {/* Title & Description */}
          <Text style={[Typography.h1, styles.title]}>Under Review</Text>
          <Text style={[Typography.body, styles.description]}>
            Your profile has been submitted and is being reviewed by our admin team.
          </Text>
          <Text style={[Typography.bodySmall, styles.subdescription]}>
            This usually takes 24–48 hours. We'll notify you once verified.
          </Text>

          {/* Floating Info Card */}
          <View style={[styles.infoCard, Shadows.xl]}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: Colors.primarySoft }]}>
                <Ionicons name="time-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoTextGroup}>
                <Text style={[Typography.bodySmallMedium, { color: Colors.text }]}>Estimated Wait</Text>
                <Text style={[Typography.caption, { color: Colors.textSecondary }]}>24 – 48 hours</Text>
              </View>
            </View>
            <View style={styles.infoSep} />
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="notifications-outline" size={18} color="#D97706" />
              </View>
              <View style={styles.infoTextGroup}>
                <Text style={[Typography.bodySmallMedium, { color: Colors.text }]}>Notification</Text>
                <Text style={[Typography.caption, { color: Colors.textSecondary }]}>You'll be notified on update</Text>
              </View>
            </View>

            <Button
              label="Check Status"
              onPress={handleRefresh}
              variant="outline"
              fullWidth
              loading={isLoading}
              leftIcon="refresh-outline"
              style={{ marginTop: Spacing.xl }}
            />
          </View>

          {/* Sign out – pill */}
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
    backgroundColor: Colors.decorativeCircle,
    top: -60,
    right: -60,
  },
  decorCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.decorativeCircleLight,
    bottom: 100,
    left: -50,
  },
  decorCircle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.decorativeCircle,
    top: '40%' as any,
    right: 20,
  },
  iconContainer: { marginBottom: Spacing.xxl },
  iconOuter: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Colors.textInverse, textAlign: 'center', marginBottom: Spacing.md },
  description: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  subdescription: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
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
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  infoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoTextGroup: {
    flex: 1,
  },
  infoSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.xs,
  },
  signOutBtn: {
    marginTop: Spacing.xl,
  },
});
