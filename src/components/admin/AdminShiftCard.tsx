import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import type { AdminShiftListItem } from '../../types';
import { formatShiftRangeCompact, formatPKR } from '../../utils/date';

// ─── Status Theme ─────────────────────────────────────────────────────────────
const STATUS_THEME: Record<string, { color: string; bg: string }> = {
  OPEN: { color: Colors.success, bg: Colors.successLight },
  FILLED: { color: Colors.info, bg: Colors.infoLight },
  IN_PROGRESS: { color: Colors.primary, bg: Colors.primaryLight },
  COMPLETED: { color: Colors.secondary, bg: Colors.secondaryLight },
  EXPIRED: { color: Colors.textTertiary, bg: Colors.surfaceSecondary },
  CANCELLED: { color: Colors.error, bg: Colors.errorLight },
};

interface AdminShiftCardProps {
  shift: AdminShiftListItem;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function AdminShiftCard({ shift, onPress, style }: AdminShiftCardProps) {
  const statusTheme = STATUS_THEME[shift.status] ?? STATUS_THEME.OPEN;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Top Row: Status + Urgency */}
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
          <Text style={[Typography.captionMedium, { color: statusTheme.color }]}>
            {shift.status.replace(/_/g, ' ')}
          </Text>
        </View>
        {shift.urgency === 'URGENT' && (
          <View style={styles.urgentBadge}>
            <Ionicons name="flash" size={12} color={Colors.urgent} />
            <Text style={[Typography.captionMedium, { color: Colors.urgent, marginLeft: 2 }]}>
              URGENT
            </Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>{shift.title}</Text>

      {/* Hospital */}
      <View style={styles.hospitalRow}>
        <Ionicons name="business-outline" size={14} color={Colors.textTertiary} />
        <Text style={styles.hospitalText} numberOfLines={1}>
          {shift.hospitalProfile.hospitalName} • {shift.hospitalProfile.city}
        </Text>
      </View>

      {/* Time */}
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={14} color={Colors.textTertiary} />
        <Text style={styles.infoText}>
          {formatShiftRangeCompact(shift.startTime, shift.endTime)}
        </Text>
      </View>

      {/* Bottom: Pay + Applicants */}
      <View style={styles.bottomRow}>
        <View style={styles.chip}>
          <Text style={[Typography.captionMedium, { color: Colors.primary }]}>
            {formatPKR(shift.hourlyRate)}/hr
          </Text>
        </View>
        <View style={styles.chip}>
          <Text style={[Typography.captionMedium, { color: Colors.text }]}>
            {shift.department.replace(/_/g, ' ')}
          </Text>
        </View>
        <View style={[styles.chip, { marginLeft: 'auto' }]}>
          <Ionicons name="people-outline" size={12} color={Colors.textSecondary} />
          <Text style={[Typography.captionMedium, { color: Colors.textSecondary, marginLeft: 4 }]}>
            {shift._count.applications} applicant{shift._count.applications !== 1 ? 's' : ''}
          </Text>
        </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.urgentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  title: {
    ...Typography.bodySemiBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  hospitalText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
});
