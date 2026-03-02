import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import type { AdminUserListItem } from '../../types';
import { formatRelative } from '../../utils/date';

// ─── Status Display Helpers ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  PENDING_VERIFICATION: { color: Colors.warning, bg: Colors.warningLight, icon: 'time-outline' },
  VERIFIED: { color: Colors.success, bg: Colors.successLight, icon: 'checkmark-circle-outline' },
  REJECTED: { color: Colors.error, bg: Colors.errorLight, icon: 'close-circle-outline' },
  SUSPENDED: { color: Colors.statusSuspended, bg: Colors.statusSuspendedLight, icon: 'ban-outline' },
};

interface UserListCardProps {
  user: AdminUserListItem;
  onPress: () => void;
  style?: ViewStyle;
}

export default function UserListCard({ user, onPress, style }: UserListCardProps) {
  const isDoctor = user.role === 'DOCTOR';
  const name = isDoctor
    ? `Dr. ${user.doctorProfile?.firstName ?? ''} ${user.doctorProfile?.lastName ?? ''}`
    : user.hospitalProfile?.hospitalName ?? user.email;
  const subtitle = isDoctor
    ? `${user.doctorProfile?.specialty?.replace(/_/g, ' ') ?? ''} • ${user.doctorProfile?.city ?? ''}`
    : `${user.hospitalProfile?.city ?? ''}`;
  const statusCfg = STATUS_CONFIG[user.status] ?? STATUS_CONFIG.PENDING_VERIFICATION;

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar + Name */}
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: isDoctor ? Colors.primaryLight : Colors.secondaryLight }]}>
          <Ionicons
            name={isDoctor ? 'person' : 'business'}
            size={18}
            color={isDoctor ? Colors.primary : Colors.secondary}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        <View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon} size={12} color={statusCfg.color} />
            <Text style={[Typography.captionMedium, { color: statusCfg.color, marginLeft: 4 }]}>
              {user.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.rolePill, { backgroundColor: isDoctor ? Colors.primaryLight : Colors.secondaryLight }]}>
          <Text style={[Typography.captionMedium, { color: isDoctor ? Colors.primary : Colors.secondary }]}>
            {user.role}
          </Text>
        </View>
        <Text style={styles.timeText}>{formatRelative(user.createdAt)}</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    ...Typography.bodySemiBold,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  rolePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  timeText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginLeft: 'auto',
    marginRight: Spacing.sm,
  },
});
