import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { TimesheetStatus } from '../../constants/enums';
import { formatTime, formatDateShort, formatPKR, formatDuration } from '../../utils/date';
import { getAutoApproveDeadline } from '../../utils/location';
import type { Timesheet } from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────
interface TimesheetCardProps {
  timesheet: Timesheet;
  onPress: () => void;
  /** 'doctor' shows hospital info, 'hospital' shows doctor info. */
  viewAs: 'doctor' | 'hospital';
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TimesheetCard({ timesheet, onPress, viewAs, style }: TimesheetCardProps) {
  const shift = timesheet.shift;
  const hasClockedOut = !!timesheet.clockOutTime;

  // ── Auto-approve countdown ──────────────────────────────────────────────
  let autoApproveLabel: string | null = null;
  if (
    timesheet.status === TimesheetStatus.PENDING_APPROVAL &&
    timesheet.clockOutTime
  ) {
    const deadline = getAutoApproveDeadline(timesheet.clockOutTime);
    const hoursLeft = Math.max(0, (deadline.getTime() - Date.now()) / (60 * 60 * 1000));
    if (hoursLeft > 0) {
      autoApproveLabel = `Auto-approves in ${Math.ceil(hoursLeft)}h`;
    }
  }

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* ── Status badge ──────────────────────────────────────────────── */}
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusBg(timesheet.status) }]}>
          <Text style={[Typography.captionMedium, { color: statusColor(timesheet.status) }]}>
            {statusIcon(timesheet.status)} {statusLabel(timesheet.status)}
          </Text>
        </View>
        {autoApproveLabel && (
          <Text style={[Typography.caption, { color: Colors.warning }]}>
            {autoApproveLabel}
          </Text>
        )}
      </View>

      {/* ── Shift title ───────────────────────────────────────────────── */}
      <Text style={[Typography.bodySemiBold, { color: Colors.text, marginTop: Spacing.sm }]} numberOfLines={1}>
        {shift?.title ?? 'Shift'}
      </Text>

      {/* ── Entity info (hospital or doctor) ──────────────────────────── */}
      {viewAs === 'doctor' && timesheet.hospitalProfile && (
        <View style={styles.entityRow}>
          {timesheet.hospitalProfile.logoUrl ? (
            <Image source={{ uri: timesheet.hospitalProfile.logoUrl }} style={styles.entityLogo} />
          ) : (
            <View style={[styles.entityLogo, styles.entityLogoPlaceholder]}>
              <Ionicons name="business" size={10} color={Colors.textTertiary} />
            </View>
          )}
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]} numberOfLines={1}>
            {timesheet.hospitalProfile.hospitalName}, {timesheet.hospitalProfile.city}
          </Text>
        </View>
      )}

      {viewAs === 'hospital' && timesheet.doctorProfile && (
        <View style={styles.entityRow}>
          {timesheet.doctorProfile.profilePicUrl ? (
            <Image source={{ uri: timesheet.doctorProfile.profilePicUrl }} style={styles.entityLogo} />
          ) : (
            <View style={[styles.entityLogo, styles.entityLogoPlaceholder]}>
              <Ionicons name="person" size={10} color={Colors.textTertiary} />
            </View>
          )}
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]} numberOfLines={1}>
            Dr. {timesheet.doctorProfile.firstName} {timesheet.doctorProfile.lastName}
          </Text>
        </View>
      )}

      {/* ── Clock times ───────────────────────────────────────────────── */}
      {(timesheet.clockInTime || timesheet.clockOutTime) && (
        <View style={styles.clockRow}>
          <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
          <Text style={[Typography.caption, { color: Colors.textSecondary, marginLeft: 6, flex: 1 }]}>
            {timesheet.clockInTime
              ? `${formatDateShort(timesheet.clockInTime)}, ${formatTime(timesheet.clockInTime)}`
              : 'Not clocked in'}
            {' → '}
            {timesheet.clockOutTime
              ? formatTime(timesheet.clockOutTime)
              : 'In progress'}
          </Text>
        </View>
      )}

      {/* ── Shift schedule (when not yet clocked in) ──────────────────── */}
      {!timesheet.clockInTime && shift && (
        <View style={styles.clockRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textTertiary} />
          <Text style={[Typography.caption, { color: Colors.textSecondary, marginLeft: 6, flex: 1 }]}>
            {formatDateShort(shift.startTime)}, {formatTime(shift.startTime)} → {formatTime(shift.endTime)}
          </Text>
        </View>
      )}

      {/* ── Bottom row: Pay info ──────────────────────────────────────── */}
      <View style={styles.bottomRow}>
        {hasClockedOut && timesheet.hoursWorked ? (
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={[Typography.captionMedium, { color: Colors.secondary }]}>
                {formatDuration(parseFloat(timesheet.hoursWorked))}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={[Typography.captionMedium, { color: Colors.primary }]}>
                {formatPKR(timesheet.finalCalculatedPay ?? '0')}
              </Text>
            </View>
          </View>
        ) : shift ? (
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={[Typography.captionMedium, { color: Colors.primary }]}>
                {formatPKR(shift.hourlyRate)}/hr
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* ── Dispute note ──────────────────────────────────────────────── */}
      {timesheet.status === TimesheetStatus.DISPUTED && timesheet.disputeNote && (
        <View style={styles.disputeNote}>
          <Ionicons name="alert-circle" size={14} color={Colors.warning} />
          <Text
            style={[Typography.caption, { color: Colors.textSecondary, marginLeft: 6, flex: 1 }]}
            numberOfLines={2}
          >
            {timesheet.disputeNote}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function statusLabel(status: TimesheetStatus): string {
  switch (status) {
    case 'PENDING_APPROVAL': return 'PENDING';
    case 'APPROVED': return 'APPROVED';
    case 'DISPUTED': return 'DISPUTED';
    case 'RESOLVED': return 'RESOLVED';
    default: return status;
  }
}

function statusIcon(status: TimesheetStatus): string {
  switch (status) {
    case 'PENDING_APPROVAL': return '⏳';
    case 'APPROVED': return '✅';
    case 'DISPUTED': return '⚠️';
    case 'RESOLVED': return '✓';
    default: return '';
  }
}

function statusBg(status: TimesheetStatus): string {
  switch (status) {
    case 'PENDING_APPROVAL': return Colors.warningLight;
    case 'APPROVED': return Colors.successLight;
    case 'DISPUTED': return Colors.errorLight;
    case 'RESOLVED': return Colors.infoLight;
    default: return Colors.surfaceSecondary;
  }
}

function statusColor(status: TimesheetStatus): string {
  switch (status) {
    case 'PENDING_APPROVAL': return Colors.warning;
    case 'APPROVED': return Colors.success;
    case 'DISPUTED': return Colors.error;
    case 'RESOLVED': return Colors.info;
    default: return Colors.textSecondary;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  entityLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: Colors.surfaceSecondary,
  },
  entityLogoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  bottomRow: {
    marginTop: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.xs,
  },
  disputeNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});
