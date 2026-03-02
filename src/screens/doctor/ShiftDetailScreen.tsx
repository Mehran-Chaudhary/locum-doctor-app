import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { useShiftStore } from '../../stores/shift.store';
import { useApplicationStore } from '../../stores/application.store';
import Button from '../../components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import {
  ShiftUrgency,
  ShiftStatus,
  DEPARTMENT_OPTIONS,
  SPECIALTY_OPTIONS,
} from '../../constants/enums';
import {
  formatShiftRange,
  formatDuration,
  formatPKR,
  formatDate,
  formatRelative,
} from '../../utils/date';
import { getErrorMessage } from '../../utils/error';

// ─── Route params ─────────────────────────────────────────────────────────────
type ShiftDetailParams = { ShiftDetail: { shiftId: string } };

// ─── Component ────────────────────────────────────────────────────────────────
export default function ShiftDetailScreen() {
  const route = useRoute<RouteProp<ShiftDetailParams, 'ShiftDetail'>>();
  const navigation = useNavigation();
  const { shiftId } = route.params;

  const { currentShift, detailLoading, loadShiftDetail, clearShiftDetail } = useShiftStore();
  const { applyForShift, mutating } = useApplicationStore();

  const [applied, setApplied] = useState(false);

  useEffect(() => {
    loadShiftDetail(shiftId);
    return () => clearShiftDetail();
  }, [shiftId]);

  // ── Apply handler ──────────────────────────────────────────────────────
  const handleApply = useCallback(() => {
    Alert.alert(
      'Confirm Application',
      'Are you sure you want to apply for this shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            try {
              await applyForShift(shiftId);
              setApplied(true);
              Toast.show({ type: 'success', text1: 'Applied!', text2: 'Your application has been submitted.' });
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Application Failed', text2: getErrorMessage(err) });
            }
          },
        },
      ],
    );
  }, [shiftId, applyForShift]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (detailLoading || !currentShift) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const shift = currentShift;
  const hospital = shift.hospitalProfile;
  const isUrgent = shift.urgency === ShiftUrgency.URGENT;
  const isOpen = shift.status === ShiftStatus.OPEN;
  const canApply = isOpen && !applied;
  const departmentLabel = DEPARTMENT_OPTIONS.find((d) => d.value === shift.department)?.label ?? shift.department;
  const specialtyLabel = SPECIALTY_OPTIONS.find((s) => s.value === shift.requiredSpecialty)?.label ?? shift.requiredSpecialty;
  const applicants = shift._count?.applications ?? 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Urgency badge ──────────────────────────────────────────────── */}
        {isUrgent && (
          <View style={styles.urgentBanner}>
            <Ionicons name="flash" size={16} color={Colors.urgent} />
            <Text style={[Typography.bodySmallSemiBold, { color: Colors.urgent, marginLeft: 6 }]}>
              URGENT
            </Text>
          </View>
        )}

        {/* ── Title + Status ─────────────────────────────────────────────── */}
        <Text style={[Typography.h2, { color: Colors.text }]}>{shift.title}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg(shift.status) }]}>
            <Text style={[Typography.captionMedium, { color: statusColor(shift.status) }]}>
              {shift.status.replace(/_/g, ' ')}
            </Text>
          </View>
          <Text style={[Typography.caption, { color: Colors.textTertiary, marginLeft: Spacing.sm }]}>
            Posted {formatRelative(shift.createdAt)}
          </Text>
        </View>

        {/* ── Hospital card ──────────────────────────────────────────────── */}
        {hospital && (
          <View style={styles.hospitalCard}>
            {hospital.logoUrl ? (
              <Image source={{ uri: hospital.logoUrl }} style={styles.hospitalLogo} />
            ) : (
              <View style={[styles.hospitalLogo, styles.hospitalLogoPlaceholder]}>
                <Ionicons name="business" size={20} color={Colors.textTertiary} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={[Typography.bodySemiBold, { color: Colors.text }]}>
                {hospital.hospitalName}
              </Text>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                {hospital.address}, {hospital.city}
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={Colors.warning} />
                <Text style={[Typography.bodySmallMedium, { color: Colors.text, marginLeft: 4 }]}>
                  {hospital.averageRating.toFixed(1)}
                </Text>
                <Text style={[Typography.caption, { color: Colors.textTertiary, marginLeft: 4 }]}>
                  ({hospital.totalReviews} reviews)
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Details section ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[Typography.h4, { color: Colors.text, marginBottom: Spacing.md }]}>
            Details
          </Text>
          <DetailRow icon="grid-outline" label="Department" value={departmentLabel} />
          <DetailRow icon="medkit-outline" label="Specialty Needed" value={specialtyLabel} />
          <DetailRow icon="time-outline" label="Duration" value={formatDuration(shift.totalDurationHrs)} />
          <DetailRow icon="cash-outline" label="Hourly Rate" value={`${formatPKR(shift.hourlyRate)}/hr`} />
          <DetailRow icon="wallet-outline" label="Total Pay" value={formatPKR(shift.totalEstimatedPay)} />
        </View>

        {/* ── Schedule section ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[Typography.h4, { color: Colors.text, marginBottom: Spacing.md }]}>
            Schedule
          </Text>
          <View style={styles.scheduleCard}>
            <Ionicons name="calendar" size={20} color={Colors.primary} />
            <Text
              style={[Typography.bodySmallMedium, { color: Colors.text, marginLeft: Spacing.md, flex: 1 }]}
            >
              {formatShiftRange(shift.startTime, shift.endTime)}
            </Text>
          </View>
        </View>

        {/* ── Description ────────────────────────────────────────────────── */}
        {shift.description && (
          <View style={styles.section}>
            <Text style={[Typography.h4, { color: Colors.text, marginBottom: Spacing.md }]}>
              Description
            </Text>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary, lineHeight: 22 }]}>
              {shift.description}
            </Text>
          </View>
        )}

        {/* ── Bottom info chips ──────────────────────────────────────────── */}
        <View style={styles.chipRow}>
          {shift.distanceKm != null && (
            <View style={styles.infoChip}>
              <Ionicons name="location" size={14} color={Colors.primary} />
              <Text style={[Typography.bodySmallMedium, { color: Colors.primary, marginLeft: 4 }]}>
                {shift.distanceKm.toFixed(1)} km away
              </Text>
            </View>
          )}
          <View style={styles.infoChip}>
            <Ionicons name="people" size={14} color={Colors.textSecondary} />
            <Text style={[Typography.bodySmallMedium, { color: Colors.textSecondary, marginLeft: 4 }]}>
              {applicants} applicant{applicants !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky bottom bar ───────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        {applied ? (
          <View style={styles.appliedBar}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
            <Text style={[Typography.bodySemiBold, { color: Colors.success, marginLeft: Spacing.sm }]}>
              Application Submitted
            </Text>
          </View>
        ) : (
          <Button
            label="Apply Now"
            onPress={handleApply}
            loading={mutating}
            disabled={!canApply}
            fullWidth
            leftIcon="paper-plane-outline"
          />
        )}
      </View>
    </View>
  );
}

// ─── Detail row ───────────────────────────────────────────────────────────────
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={Colors.textTertiary} />
      <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginLeft: Spacing.sm, flex: 1 }]}>
        {label}
      </Text>
      <Text style={[Typography.bodySmallSemiBold, { color: Colors.text }]}>{value}</Text>
    </View>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────
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
  screen: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl + 30,
    paddingBottom: 120,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.urgentLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  // Hospital card
  hospitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  hospitalLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSecondary,
  },
  hospitalLogoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl + 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.md,
  },
  appliedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
});
