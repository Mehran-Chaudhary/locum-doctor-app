import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import type { AdminDispute } from '../../types';
import { formatDate, formatTime, formatPKR } from '../../utils/date';

interface DisputeCardProps {
  dispute: AdminDispute;
  onPress: () => void;
  style?: ViewStyle;
}

export default function DisputeCard({ dispute, onPress, style }: DisputeCardProps) {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.disputeBadge}>
          <Ionicons name="warning" size={14} color={Colors.warning} />
          <Text style={[Typography.captionMedium, { color: Colors.warning, marginLeft: 4 }]}>
            DISPUTED
          </Text>
        </View>
        {dispute.resolvedAt && (
          <Text style={styles.resolvedText}>Resolved</Text>
        )}
      </View>

      {/* Shift Title */}
      <Text style={styles.shiftTitle} numberOfLines={1}>{dispute.shift.title}</Text>

      {/* Doctor / Hospital */}
      <View style={styles.partiesRow}>
        <View style={styles.party}>
          <Ionicons name="person-outline" size={14} color={Colors.primary} />
          <Text style={styles.partyText} numberOfLines={1}>
            Dr. {dispute.doctorProfile.firstName} {dispute.doctorProfile.lastName}
          </Text>
        </View>
        <View style={styles.party}>
          <Ionicons name="business-outline" size={14} color={Colors.secondary} />
          <Text style={styles.partyText} numberOfLines={1}>
            {dispute.hospitalProfile.hospitalName}
          </Text>
        </View>
      </View>

      {/* Clock Times */}
      <View style={styles.timesGrid}>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Scheduled</Text>
          <Text style={styles.timeValue}>
            {formatTime(dispute.shift.startTime)} – {formatTime(dispute.shift.endTime)}
          </Text>
        </View>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Actual</Text>
          <Text style={styles.timeValue}>
            {dispute.clockInTime ? formatTime(dispute.clockInTime) : 'N/A'} –{' '}
            {dispute.clockOutTime ? formatTime(dispute.clockOutTime) : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Pay + Hours */}
      <View style={styles.payRow}>
        {dispute.hoursWorked && (
          <View style={styles.chip}>
            <Text style={[Typography.captionMedium, { color: Colors.secondary }]}>
              {parseFloat(dispute.hoursWorked).toFixed(1)} hrs
            </Text>
          </View>
        )}
        {dispute.finalCalculatedPay && (
          <View style={styles.chip}>
            <Text style={[Typography.captionMedium, { color: Colors.primary }]}>
              {formatPKR(dispute.finalCalculatedPay)}
            </Text>
          </View>
        )}
        <View style={styles.chip}>
          <Text style={[Typography.captionMedium, { color: Colors.text }]}>
            Rate: {formatPKR(dispute.shift.hourlyRate)}/hr
          </Text>
        </View>
      </View>

      {/* Dispute Note */}
      {dispute.disputeNote && (
        <View style={styles.noteBox}>
          <Ionicons name="chatbox-ellipses-outline" size={14} color={Colors.warning} />
          <Text style={styles.noteText} numberOfLines={3}>{dispute.disputeNote}</Text>
        </View>
      )}

      {/* Resolve CTA */}
      <View style={styles.ctaRow}>
        <Text style={styles.dateText}>{formatDate(dispute.updatedAt)}</Text>
        <View style={styles.resolveBtn}>
          <Text style={[Typography.buttonSmall, { color: Colors.admin }]}>Resolve</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.admin} />
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
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
    ...Shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  disputeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  resolvedText: {
    ...Typography.captionMedium,
    color: Colors.success,
  },
  shiftTitle: {
    ...Typography.bodySemiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  partiesRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.lg,
  },
  party: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  partyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  timesGrid: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  timeValue: {
    ...Typography.bodySmallMedium,
    color: Colors.text,
  },
  payRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  noteText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
