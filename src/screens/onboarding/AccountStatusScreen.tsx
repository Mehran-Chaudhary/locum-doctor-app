import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  title: string;
  description: string;
}> = {
  [AccountStatus.REJECTED]: {
    icon: 'close-circle-outline',
    iconColor: Colors.statusRejected,
    bgColor: Colors.statusRejectedLight,
    title: 'Account Rejected',
    description:
      'Unfortunately, your profile was not approved. This may be due to incomplete documentation or mismatched credentials. Please contact our support team for more details.',
  },
  [AccountStatus.SUSPENDED]: {
    icon: 'ban-outline',
    iconColor: Colors.statusSuspended,
    bgColor: Colors.statusSuspendedLight,
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

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@locumdoc.pk?subject=Account%20Issue').catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Icon */}
        <View style={[styles.iconOuter, { backgroundColor: config.bgColor }]}>
          <View style={styles.iconInner}>
            <Ionicons name={config.icon} size={48} color={config.iconColor} />
          </View>
        </View>

        {/* Text */}
        <Text style={[Typography.h2, styles.title]}>{config.title}</Text>
        <Text style={[Typography.body, styles.description]}>{config.description}</Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>Account</Text>
            <Text style={[Typography.bodySmallMedium, { color: Colors.text }]}>{user?.email}</Text>
          </View>
          <View style={styles.infoSep} />
          <View style={styles.infoRow}>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
              <Text style={[Typography.captionMedium, { color: config.iconColor }]}>
                {status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <Button
          label="Contact Support"
          onPress={handleContactSupport}
          fullWidth
          leftIcon="mail-outline"
          style={{ marginTop: Spacing.xxl }}
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
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xxl,
    lineHeight: 24,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  infoSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
});
