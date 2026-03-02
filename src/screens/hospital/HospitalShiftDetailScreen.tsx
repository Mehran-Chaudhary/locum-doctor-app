import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { useShiftStore } from '../../stores/shift.store';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import {
  ShiftUrgency,
  DEPARTMENT_OPTIONS,
  SPECIALTY_OPTIONS,
} from '../../constants/enums';
import {
  formatShiftRange,
  formatDuration,
  formatPKR,
  formatRelative,
} from '../../utils/date';

// ─── Route params ─────────────────────────────────────────────────────────────
type Params = { HospitalShiftDetail: { shiftId: string } };

// ─── Component ────────────────────────────────────────────────────────────────
export default function HospitalShiftDetailScreen() {
  const route = useRoute<RouteProp<Params, 'HospitalShiftDetail'>>();
  const navigation = useNavigation();
  const { shiftId } = route.params;

  const { currentShift, detailLoading, loadShiftDetail, clearShiftDetail } = useShiftStore();

  useEffect(() => {
    loadShiftDetail(shiftId);
    return () => clearShiftDetail();
  }, [shiftId]);

  if (detailLoading || !currentShift) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const shift = currentShift;
  const isUrgent = shift.urgency === ShiftUrgency.URGENT;
  const departmentLabel = DEPARTMENT_OPTIONS.find((d) => d.value === shift.department)?.label ?? shift.department;
  const specialtyLabel = SPECIALTY_OPTIONS.find((s) => s.value === shift.requiredSpecialty)?.label ?? shift.requiredSpecialty;
  const applicants = shift._count?.applications ?? 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <Ionicons
          name="arrow-back"
          size={24}
          color={Colors.text}
          onPress={() => navigation.goBack()}
          style={{ marginBottom: Spacing.lg }}
        />

        {isUrgent && (
          <View style={styles.urgentBanner}>
            <Ionicons name="flash" size={16} color={Colors.urgent} />
            <Text style={[Typography.bodySmallSemiBold, { color: Colors.urgent, marginLeft: 6 }]}>
              URGENT
            </Text>
          </View>
        )}

        <Text style={[Typography.h2, { color: Colors.text }]}>{shift.title}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.badge, { backgroundColor: statusBg(shift.status) }]}>
            <Text style={[Typography.captionMedium, { color: statusColor(shift.status) }]}>
              {shift.status.replace(/_/g, ' ')}
            </Text>
          </View>
          <Text style={[Typography.caption, { color: Colors.textTertiary, marginLeft: Spacing.sm }]}>
            Posted {formatRelative(shift.createdAt)}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={[Typography.h4, { color: Colors.text, marginBottom: Spacing.md }]}>Details</Text>
          <DetailRow icon="grid-outline" label="Department" value={departmentLabel} />
          <DetailRow icon="medkit-outline" label="Specialty" value={specialtyLabel} />
          <DetailRow icon="time-outline" label="Duration" value={formatDuration(shift.totalDurationHrs)} />
          <DetailRow icon="cash-outline" label="Rate" value={`${formatPKR(shift.hourlyRate)}/hr`} />
          <DetailRow icon="wallet-outline" label="Total Pay" value={formatPKR(shift.totalEstimatedPay)} />
          <DetailRow icon="people-outline" label="Applicants" value={String(applicants)} />
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={[Typography.h4, { color: Colors.text, marginBottom: Spacing.md }]}>Schedule</Text>
          <View style={styles.scheduleCard}>
            <Ionicons name="calendar" size={20} color={Colors.primary} />
            <Text style={[Typography.bodySmallMedium, { color: Colors.text, marginLeft: Spacing.md, flex: 1 }]}>
              {formatShiftRange(shift.startTime, shift.endTime)}
            </Text>
          </View>
        </View>

        {shift.description && (
          <View style={styles.section}>
            <Text style={[Typography.h4, { color: Colors.text, marginBottom: Spacing.md }]}>Description</Text>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary, lineHeight: 22 }]}>
              {shift.description}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Detail row ───────────────────────────────────────────────────────────────
function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={Colors.textTertiary} />
      <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginLeft: Spacing.sm, flex: 1 }]}>{label}</Text>
      <Text style={[Typography.bodySmallSemiBold, { color: Colors.text }]}>{value}</Text>
    </View>
  );
}

function statusBg(status: string) {
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
function statusColor(status: string) {
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
    paddingBottom: Spacing.xxxxl * 2,
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
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  section: { marginBottom: Spacing.xl },
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
});
