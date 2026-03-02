import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { useShiftStore } from '../../stores/shift.store';
import { useApplicationStore } from '../../stores/application.store';
import { useAuthStore } from '../../stores/auth.store';
import Button from '../../components/ui/Button';
import { Colors, Spacing } from '../../constants/theme';
import {
  ShiftUrgency,
  ShiftStatus,
  AccountStatus,
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
  const navigation = useNavigation<any>();
  const { shiftId } = route.params;

  const { currentShift, detailLoading, loadShiftDetail, clearShiftDetail } = useShiftStore();
  const { applyForShift, mutating } = useApplicationStore();
  const { user } = useAuthStore();

  const [applied, setApplied] = useState(false);

  // ── Auth & verification state ──────────────────────────────────────────
  const isGuest = !user;
  const isPending = user?.status === AccountStatus.PENDING_VERIFICATION;

  useEffect(() => {
    loadShiftDetail(shiftId, isGuest);
    return () => clearShiftDetail();
  }, [shiftId, isGuest]);

  // ── Apply handler ──────────────────────────────────────────────────────
  const handleApply = useCallback(() => {
    // Guest → redirect to login
    if (isGuest) {
      Toast.show({ type: 'info', text1: 'Login Required', text2: 'Please log in to apply for shifts.' });
      navigation.navigate('Login');
      return;
    }

    // Pending verification → show toast, don't apply
    if (isPending) {
      Toast.show({ type: 'info', text1: 'Apply Disabled', text2: 'Your PMDC verification is still pending. You can browse but cannot apply yet.' });
      return;
    }

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
  }, [shiftId, applyForShift, isGuest, isPending, navigation]);

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

        {/* ── Back button ──────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>

        {/* ── Top pills: Status + Urgency + Posted ──────────────────────── */}
        <View style={styles.pillRow}>
          <View style={[styles.pill, { backgroundColor: statusBg(shift.status) }]}>
            <Text style={[styles.pillText, { color: statusColor(shift.status) }]}>
              {shift.status.replace(/_/g, ' ')}
            </Text>
          </View>
          {isUrgent && (
            <View style={styles.urgentPill}>
              <Ionicons name="flash" size={10} color="#FFF" />
              <Text style={styles.urgentPillText}>URGENT</Text>
            </View>
          )}
          <Text style={styles.postedLabel}>Posted {formatRelative(shift.createdAt)}</Text>
        </View>

        {/* ── Title ──────────────────────────────────────────────────────── */}
        <Text style={styles.title}>{shift.title}</Text>

        {/* ── Quick stats row: Distance · Applicants ─────────────────────── */}
        <View style={styles.quickStats}>
          {shift.distanceKm != null && (
            <View style={styles.quickStat}>
              <Ionicons name="navigate" size={12} color={Colors.primary} />
              <Text style={styles.quickStatText}>{shift.distanceKm.toFixed(1)} km away</Text>
            </View>
          )}
          <View style={styles.quickStat}>
            <Ionicons name="people" size={12} color={Colors.textSecondary} />
            <Text style={styles.quickStatTextMuted}>
              {applicants} applicant{applicants !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* ── Pay highlight card ─────────────────────────────────────────── */}
        <View style={styles.payCard}>
          <View style={styles.payCol}>
            <Text style={styles.payLabel}>Hourly</Text>
            <Text style={styles.payValue}>{formatPKR(shift.hourlyRate)}</Text>
          </View>
          <View style={styles.payDivider} />
          <View style={styles.payCol}>
            <Text style={styles.payLabel}>Duration</Text>
            <Text style={styles.payValueAlt}>{formatDuration(shift.totalDurationHrs)}</Text>
          </View>
          <View style={styles.payDivider} />
          <View style={styles.payCol}>
            <Text style={styles.payLabel}>Total</Text>
            <Text style={styles.payValueTotal}>{formatPKR(shift.totalEstimatedPay)}</Text>
          </View>
        </View>

        {/* ── Hospital section ───────────────────────────────────────────── */}
        {hospital && (
          <View style={styles.hospitalCard}>
            <View style={styles.hospitalTop}>
              {hospital.logoUrl ? (
                <Image source={{ uri: hospital.logoUrl }} style={styles.hospitalLogo} />
              ) : (
                <View style={[styles.hospitalLogo, styles.hospitalLogoFallback]}>
                  <Ionicons name="business" size={16} color={Colors.textTertiary} />
                </View>
              )}
              <View style={styles.hospitalInfo}>
                <Text style={styles.hospitalName}>{hospital.hospitalName}</Text>
                <Text style={styles.hospitalAddress} numberOfLines={1}>
                  {hospital.address}, {hospital.city}
                </Text>
              </View>
            </View>
            <View style={styles.hospitalBottom}>
              <View style={styles.ratingChip}>
                <Ionicons name="star" size={11} color={Colors.warning} />
                <Text style={styles.ratingText}>{hospital.averageRating.toFixed(1)}</Text>
                <Text style={styles.reviewsText}>({hospital.totalReviews})</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Schedule card ──────────────────────────────────────────────── */}
        <View style={styles.scheduleCard}>
          <Ionicons name="calendar" size={16} color={Colors.primary} />
          <Text style={styles.scheduleText}>
            {formatShiftRange(shift.startTime, shift.endTime)}
          </Text>
        </View>

        {/* ── Details grid (2 cols) ──────────────────────────────────────── */}
        <View style={styles.detailGrid}>
          <View style={styles.detailCell}>
            <Ionicons name="grid-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.detailLabel}>Department</Text>
            <Text style={styles.detailValue}>{departmentLabel}</Text>
          </View>
          <View style={styles.detailCell}>
            <Ionicons name="medkit-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.detailLabel}>Specialty</Text>
            <Text style={styles.detailValue}>{specialtyLabel}</Text>
          </View>
        </View>

        {/* ── Description ────────────────────────────────────────────────── */}
        {shift.description && (
          <View style={styles.descSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descText}>{shift.description}</Text>
          </View>
        )}

      </ScrollView>

      {/* ── Pending verification banner ─────────────────────────────────── */}
      {isPending && (
        <View style={styles.pendingBanner}>
          <Ionicons name="hourglass-outline" size={14} color={Colors.statusPending} />
          <Text style={styles.pendingText}>
            PMDC verification pending — you can browse but cannot apply yet.
          </Text>
        </View>
      )}

      {/* ── Sticky bottom bar ───────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        {applied ? (
          <View style={styles.appliedBar}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.appliedText}>Application Submitted</Text>
          </View>
        ) : isGuest ? (
          <Button
            label="Login to Apply"
            onPress={handleApply}
            fullWidth
            leftIcon="log-in-outline"
          />
        ) : (
          <Button
            label={isPending ? 'Verification Pending' : 'Apply Now'}
            onPress={handleApply}
            loading={mutating}
            disabled={!canApply || isPending}
            fullWidth
            leftIcon={isPending ? 'hourglass-outline' : 'paper-plane-outline'}
          />
        )}
      </View>
    </View>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────
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
const PAD = 16;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: PAD,
    paddingTop: Spacing.xxl + 30,
    paddingBottom: 110,
  },

  /* ── Back button ─────────────────────────────────────────────────────────── */
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  /* ── Top pills ───────────────────────────────────────────────────────────── */
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  urgentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.urgent,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  urgentPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  postedLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginLeft: 'auto',
  },

  /* ── Title ───────────────────────────────────────────────────────────────── */
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 6,
  },

  /* ── Quick stats ─────────────────────────────────────────────────────────── */
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickStatText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  quickStatTextMuted: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },

  /* ── Pay highlight card ──────────────────────────────────────────────────── */
  payCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  payCol: {
    flex: 1,
    alignItems: 'center',
  },
  payDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 2,
  },
  payLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  payValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  payValueAlt: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.secondary,
  },
  payValueTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },

  /* ── Hospital card ───────────────────────────────────────────────────────── */
  hospitalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  hospitalTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
  },
  hospitalLogoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalInfo: {
    flex: 1,
    marginLeft: 10,
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  hospitalAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  hospitalBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewsText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },

  /* ── Schedule card ───────────────────────────────────────────────────────── */
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  scheduleText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primaryDark,
    flex: 1,
  },

  /* ── Details grid ────────────────────────────────────────────────────────── */
  detailGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  detailCell: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },

  /* ── Description ─────────────────────────────────────────────────────────── */
  descSection: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  descText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  /* ── Pending banner ──────────────────────────────────────────────────────── */
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: PAD,
    paddingVertical: 8,
    gap: 8,
  },
  pendingText: {
    fontSize: 12,
    color: Colors.statusPending,
    flex: 1,
    lineHeight: 16,
  },

  /* ── Bottom bar ──────────────────────────────────────────────────────────── */
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: PAD,
    paddingTop: 10,
    paddingBottom: Spacing.xxl + 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  appliedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  appliedText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.success,
  },
});
