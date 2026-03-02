import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
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
      style={[styles.card, isUrgent && styles.cardUrgent, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* ── Top Row: Urgency badge + Status ─────────────────────────────── */}
      <View style={styles.topRow}>
        {isUrgent && (
          <View style={styles.urgentBadge}>
            <Ionicons name="flash" size={12} color={Colors.urgent} />
            <Text style={[Typography.captionMedium, { color: Colors.urgent, marginLeft: 2 }]}>
              URGENT
            </Text>
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: statusBg(shift.status) }]}>
          <Text style={[Typography.captionMedium, { color: statusColor(shift.status) }]}>
            {shift.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {/* ── Title ────────────────────────────────────────────────────────── */}
      <Text style={[Typography.bodySemiBold, { color: Colors.text }]} numberOfLines={1}>
        {shift.title}
      </Text>

      {/* ── Hospital info ────────────────────────────────────────────────── */}
      {hospital && (
        <View style={styles.hospitalRow}>
          {hospital.logoUrl ? (
            <Image source={{ uri: hospital.logoUrl }} style={styles.hospitalLogo} />
          ) : (
            <View style={[styles.hospitalLogo, styles.hospitalLogoPlaceholder]}>
              <Ionicons name="business" size={14} color={Colors.textTertiary} />
            </View>
          )}
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary, flex: 1 }]} numberOfLines={1}>
            {hospital.hospitalName}
          </Text>
          {shift.distanceKm != null && (
            <View style={styles.distanceBadge}>
              <Ionicons name="location" size={12} color={Colors.primary} />
              <Text style={[Typography.caption, { color: Colors.primary, marginLeft: 2 }]}>
                {shift.distanceKm.toFixed(1)} km
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Schedule ─────────────────────────────────────────────────────── */}
      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={14} color={Colors.textTertiary} />
        <Text style={[Typography.caption, { color: Colors.textSecondary, marginLeft: 6, flex: 1 }]}>
          {formatShiftRangeCompact(shift.startTime, shift.endTime)}
        </Text>
      </View>

      {/* ── Bottom Row: Pay + Duration + Applicants ──────────────────────── */}
      <View style={styles.bottomRow}>
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={[Typography.captionMedium, { color: Colors.primary }]}>
              {formatPKR(shift.hourlyRate)}/hr
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={[Typography.captionMedium, { color: Colors.secondary }]}>
              {formatDuration(shift.totalDurationHrs)}
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={[Typography.captionMedium, { color: Colors.text }]}>
              {formatPKR(shift.totalEstimatedPay)}
            </Text>
          </View>
        </View>
        {showApplicantCount && applicants > 0 && (
          <View style={styles.applicantBadge}>
            <Ionicons name="people" size={12} color={Colors.textSecondary} />
            <Text style={[Typography.caption, { color: Colors.textSecondary, marginLeft: 3 }]}>
              {applicants}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Status color helpers ─────────────────────────────────────────────────────
function statusBg(status: string): string {
  switch (status) {
    case 'OPEN': return Colors.successLight;
    case 'FILLED': return Colors.infoLight;
    case 'IN_PROGRESS': return Colors.warningLight;
    case 'COMPLETED': return Colors.primaryLight;
    case 'EXPIRED': return Colors.surfaceSecondary;
    case 'CANCELLED': return Colors.errorLight;
    default: return Colors.surfaceSecondary;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'OPEN': return Colors.success;
    case 'FILLED': return Colors.info;
    case 'IN_PROGRESS': return Colors.warning;
    case 'COMPLETED': return Colors.primary;
    case 'EXPIRED': return Colors.textTertiary;
    case 'CANCELLED': return Colors.error;
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
  cardUrgent: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.urgent,
  },
  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.urgentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  // Hospital
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  hospitalLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  hospitalLogoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  // Detail row
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  // Bottom
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  applicantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
