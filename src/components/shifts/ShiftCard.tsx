import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/theme';
import { ShiftUrgency } from '../../constants/enums';
import { formatShiftRangeCompact, formatDuration, formatPKR } from '../../utils/date';
import type { Shift } from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────
interface ShiftCardProps {
  shift: Shift;
  onPress: () => void;
  /** If true, show the applicant count badge (hospital view). */
  showApplicantCount?: boolean;
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ShiftCard({ shift, onPress, showApplicantCount = true, style }: ShiftCardProps) {
  const isUrgent = shift.urgency === ShiftUrgency.URGENT;
  const hospital = shift.hospitalProfile;
  const applicants = shift._count?.applications ?? 0;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {/* ── Left accent strip (status color) ───────────────────────────── */}
      <View style={[styles.accent, { backgroundColor: accentColor(shift.status, isUrgent) }]} />

      <View style={styles.content}>
        {/* ── Row 1: Title + Hourly Rate ─────────────────────────────────── */}
        <View style={styles.rowSpread}>
          <Text style={styles.title} numberOfLines={1}>{shift.title}</Text>
          <Text style={styles.payRate}>{formatPKR(shift.hourlyRate)}/hr</Text>
        </View>

        {/* ── Row 2: Hospital + Distance ─────────────────────────────────── */}
        {hospital && (
          <View style={styles.infoRow}>
            {hospital.logoUrl ? (
              <Image source={{ uri: hospital.logoUrl }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoFallback]}>
                <Ionicons name="business" size={9} color={Colors.textTertiary} />
              </View>
            )}
            <Text style={styles.hospitalName} numberOfLines={1}>{hospital.hospitalName}</Text>
            {shift.distanceKm != null && (
              <>
                <Text style={styles.dot}>·</Text>
                <Ionicons name="navigate" size={10} color={Colors.primary} />
                <Text style={styles.distanceLabel}>{shift.distanceKm.toFixed(1)} km</Text>
              </>
            )}
          </View>
        )}

        {/* ── Row 3: Schedule + Duration ──────────────────────────────────── */}
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={11} color={Colors.textTertiary} />
          <Text style={styles.scheduleLabel}>
            {formatShiftRangeCompact(shift.startTime, shift.endTime)}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.durationLabel}>{formatDuration(shift.totalDurationHrs)}</Text>
        </View>

        {/* ── Row 4: Badges + Total Pay + Applicants ─────────────────────── */}
        <View style={styles.rowSpread}>
          <View style={styles.tags}>
            <View style={[styles.pill, { backgroundColor: statusBg(shift.status) }]}>
              <Text style={[styles.pillText, { color: statusColor(shift.status) }]}>
                {shift.status.replace(/_/g, ' ')}
              </Text>
            </View>
            {isUrgent && (
              <View style={styles.urgentPill}>
                <Ionicons name="flash" size={9} color="#FFF" />
                <Text style={styles.urgentPillText}>URGENT</Text>
              </View>
            )}
          </View>
          <View style={styles.payTotalRow}>
            <Text style={styles.totalPay}>{formatPKR(shift.totalEstimatedPay)}</Text>
            {showApplicantCount && applicants > 0 && (
              <View style={styles.applicants}>
                <Ionicons name="people" size={10} color={Colors.textTertiary} />
                <Text style={styles.applicantsLabel}>{applicants}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Accent color (urgent overrides status) ───────────────────────────────────
function accentColor(status: string, isUrgent: boolean): string {
  if (isUrgent) return Colors.urgent;
  return statusColor(status);
}

// ─── Status color helpers ─────────────────────────────────────────────────────
function statusBg(status: string): string {
  switch (status) {
    case 'OPEN':        return Colors.successLight;
    case 'FILLED':      return Colors.infoLight;
    case 'IN_PROGRESS': return Colors.warningLight;
    case 'COMPLETED':   return Colors.primaryLight;
    case 'EXPIRED':     return Colors.surfaceSecondary;
    case 'CANCELLED':   return Colors.errorLight;
    default:            return Colors.surfaceSecondary;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'OPEN':        return Colors.success;
    case 'FILLED':      return Colors.info;
    case 'IN_PROGRESS': return Colors.warning;
    case 'COMPLETED':   return Colors.primary;
    case 'EXPIRED':     return Colors.textTertiary;
    case 'CANCELLED':   return Colors.error;
    default:            return Colors.textSecondary;
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

  /* ── Generic row layouts ─────────────────────────────────────────────────── */
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
  payRate: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },

  /* ── Row 2: Hospital ─────────────────────────────────────────────────────── */
  logo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 5,
    backgroundColor: Colors.surfaceSecondary,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalName: {
    fontSize: 12,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  dot: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginHorizontal: 5,
  },
  distanceLabel: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 2,
  },

  /* ── Row 3: Schedule ─────────────────────────────────────────────────────── */
  scheduleLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  durationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondary,
  },

  /* ── Row 4: Badges + Totals ──────────────────────────────────────────────── */
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  urgentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.urgent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  urgentPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  payTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  totalPay: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  applicants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  applicantsLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});
