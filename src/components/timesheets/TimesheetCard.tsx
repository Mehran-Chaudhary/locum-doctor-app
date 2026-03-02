import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
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
      activeOpacity={0.6}
    >
      {/* Left accent strip */}
      <View style={[styles.accent, { backgroundColor: statusAccent(timesheet.status) }]} />

      <View style={styles.content}>
        {/* ── Row 1: Title + Pay/Rate ─────────────────────────────────── */}
        <View style={styles.rowSpread}>
          <Text style={styles.title} numberOfLines={1}>
            {shift?.title ?? 'Shift'}
          </Text>
          {hasClockedOut && timesheet.finalCalculatedPay ? (
            <Text style={styles.payValue}>{formatPKR(timesheet.finalCalculatedPay)}</Text>
          ) : shift ? (
            <Text style={styles.rateValue}>{formatPKR(shift.hourlyRate)}/hr</Text>
          ) : null}
        </View>

        {/* ── Row 2: Entity (hospital or doctor) ─────────────────────── */}
        {viewAs === 'doctor' && timesheet.hospitalProfile && (
          <View style={styles.infoRow}>
            {timesheet.hospitalProfile.logoUrl ? (
              <Image source={{ uri: timesheet.hospitalProfile.logoUrl }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoFallback]}>
                <Ionicons name="business" size={8} color={Colors.textTertiary} />
              </View>
            )}
            <Text style={styles.entityLabel} numberOfLines={1}>
              {timesheet.hospitalProfile.hospitalName}, {timesheet.hospitalProfile.city}
            </Text>
          </View>
        )}

        {viewAs === 'hospital' && timesheet.doctorProfile && (
          <View style={styles.infoRow}>
            {timesheet.doctorProfile.profilePicUrl ? (
              <Image source={{ uri: timesheet.doctorProfile.profilePicUrl }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoFallback]}>
                <Ionicons name="person" size={8} color={Colors.textTertiary} />
              </View>
            )}
            <Text style={styles.entityLabel} numberOfLines={1}>
              Dr. {timesheet.doctorProfile.firstName} {timesheet.doctorProfile.lastName}
            </Text>
          </View>
        )}

        {/* ── Row 3: Clock times or Schedule ─────────────────────────── */}
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={11} color={Colors.textTertiary} />
          {timesheet.clockInTime ? (
            <Text style={styles.timeLabel}>
              {formatDateShort(timesheet.clockInTime)}, {formatTime(timesheet.clockInTime)}
              {' → '}
              {timesheet.clockOutTime ? formatTime(timesheet.clockOutTime) : 'In progress'}
            </Text>
          ) : shift ? (
            <Text style={styles.timeLabel}>
              {formatDateShort(shift.startTime)}, {formatTime(shift.startTime)} → {formatTime(shift.endTime)}
            </Text>
          ) : (
            <Text style={styles.timeLabel}>Not clocked in</Text>
          )}
        </View>

        {/* ── Row 4: Status + Duration + Auto-approve ────────────────── */}
        <View style={styles.rowSpread}>
          <View style={styles.tags}>
            <View style={[styles.statusPill, { backgroundColor: statusBg(timesheet.status) }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor(timesheet.status) }]} />
              <Text style={[styles.statusText, { color: statusColor(timesheet.status) }]}>
                {statusLabel(timesheet.status)}
              </Text>
            </View>
            {hasClockedOut && timesheet.hoursWorked && (
              <View style={styles.durationChip}>
                <Text style={styles.durationText}>
                  {formatDuration(parseFloat(timesheet.hoursWorked))}
                </Text>
              </View>
            )}
          </View>
          {autoApproveLabel && (
            <Text style={styles.autoApproveLabel}>{autoApproveLabel}</Text>
          )}
        </View>

        {/* ── Dispute note snippet ────────────────────────────────────── */}
        {timesheet.status === TimesheetStatus.DISPUTED && timesheet.disputeNote && (
          <View style={styles.disputeRow}>
            <Ionicons name="alert-circle" size={11} color={Colors.error} />
            <Text style={styles.disputeText} numberOfLines={1}>{timesheet.disputeNote}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function statusLabel(status: TimesheetStatus): string {
  switch (status) {
    case 'PENDING_APPROVAL': return 'Pending';
    case 'APPROVED':         return 'Approved';
    case 'DISPUTED':         return 'Disputed';
    case 'RESOLVED':         return 'Resolved';
    default:                 return status;
  }
}

function statusBg(status: TimesheetStatus): string {
  switch (status) {
    case 'PENDING_APPROVAL': return Colors.warningLight;
    case 'APPROVED':         return Colors.successLight;
    case 'DISPUTED':         return Colors.errorLight;
    case 'RESOLVED':         return Colors.infoLight;
    default:                 return Colors.surfaceSecondary;
  }
}

function statusColor(status: TimesheetStatus): string {
  switch (status) {
    case 'PENDING_APPROVAL': return Colors.warning;
    case 'APPROVED':         return Colors.success;
    case 'DISPUTED':         return Colors.error;
    case 'RESOLVED':         return Colors.info;
    default:                 return Colors.textSecondary;
  }
}

function statusAccent(status: TimesheetStatus): string {
  switch (status) {
    case 'PENDING_APPROVAL': return Colors.warning;
    case 'APPROVED':         return Colors.success;
    case 'DISPUTED':         return Colors.error;
    case 'RESOLVED':         return Colors.info;
    default:                 return Colors.border;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  /* ── Card shell ──────────────────────────────────────────────────────────── */
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  /* ── Row layouts ─────────────────────────────────────────────────────────── */
  rowSpread: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  /* ── Row 1: Title + Pay ──────────────────────────────────────────────────── */
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 10,
  },
  payValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  rateValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
  },

  /* ── Row 2: Entity ───────────────────────────────────────────────────────── */
  logo: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 5,
    backgroundColor: Colors.surfaceSecondary,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    flexShrink: 1,
  },

  /* ── Row 3: Time ─────────────────────────────────────────────────────────── */
  timeLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 4,
  },

  /* ── Row 4: Status + Duration ────────────────────────────────────────────── */
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  durationChip: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondary,
  },
  autoApproveLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.warning,
    marginTop: 6,
  },

  /* ── Dispute snippet ─────────────────────────────────────────────────────── */
  disputeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 5,
  },
  disputeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
});
