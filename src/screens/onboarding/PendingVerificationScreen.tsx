import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import Button from '../../components/ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { Colors, Typography, Spacing, Layout, BorderRadius, Shadows } from '../../constants/theme';

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PendingVerificationScreen() {
  const { refreshUser, logout, isLoading } = useAuthStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Gentle pulse animation on the icon
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const handleRefresh = async () => {
    await refreshUser();
    Toast.show({ type: 'info', text1: 'Status Checked', text2: 'Your profile is still under review.' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Animated Icon */}
        <Animated.View style={[styles.iconOuter, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.iconInner}>
            <Ionicons name="hourglass-outline" size={48} color={Colors.statusPending} />
          </View>
        </Animated.View>

        {/* Title & Description */}
        <Text style={[Typography.h2, styles.title]}>Under Review</Text>
        <Text style={[Typography.body, styles.description]}>
          Your profile has been submitted and is being reviewed by our admin team.
        </Text>
        <Text style={[Typography.bodySmall, styles.subdescription]}>
          This usually takes 24–48 hours. We'll notify you once your account is verified.
        </Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={Colors.statusPending} />
            <Text style={[Typography.bodySmall, styles.infoText]}>Estimated: 24–48 hours</Text>
          </View>
          <View style={styles.infoSep} />
          <View style={styles.infoRow}>
            <Ionicons name="notifications-outline" size={20} color={Colors.statusPending} />
            <Text style={[Typography.bodySmall, styles.infoText]}>You'll be notified on update</Text>
          </View>
        </View>

        {/* Actions */}
        <Button
          label="Check Status"
          onPress={handleRefresh}
          variant="outline"
          fullWidth
          loading={isLoading}
          leftIcon="refresh-outline"
          style={{ marginTop: Spacing.xxl }}
        />

        <Button
          label="Sign Out"
          onPress={logout}
          variant="ghost"
          fullWidth
          leftIcon="log-out-outline"
          style={{ marginTop: Spacing.md }}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.statusPendingLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  iconInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  title: { color: Colors.text, textAlign: 'center', marginBottom: Spacing.md },
  description: {
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  subdescription: {
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  // Info card
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: '100%',
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  infoText: {
    color: Colors.text,
    marginLeft: Spacing.md,
  },
  infoSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.xs,
  },
});
