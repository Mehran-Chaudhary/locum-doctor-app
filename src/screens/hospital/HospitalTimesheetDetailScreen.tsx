import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { useTimesheetStore } from '../../stores/timesheet.store';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import { TimesheetStatus, DEPARTMENT_OPTIONS, SPECIALTY_OPTIONS } from '../../constants/enums';
import {
  formatShiftRange,
  formatTime,
  formatDate,
  formatPKR,
  formatDuration,
} from '../../utils/date';
import { formatCoords, getAutoApproveDeadline } from '../../utils/location';
import { getErrorMessage } from '../../utils/error';

// ─── Route params ─────────────────────────────────────────────────────────────
type Params = { HospitalTimesheetDetail: { timesheetId: string; shiftId: string } };

// ─── Component ────────────────────────────────────────────────────────────────
export default function HospitalTimesheetDetailScreen() {
  const route = useRoute<RouteProp<Params, 'HospitalTimesheetDetail'>>();
  const navigation = useNavigation();
  const { shiftId } = route.params;

  const {
    currentTimesheet,
    currentTimesheetLoading,
    loadTimesheetByShift,
    clearCurrentTimesheet,
    approveTimesheet,
    disputeTimesheet,
    mutating,
  } = useTimesheetStore();

  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeNote, setDisputeNote] = useState('');

  useEffect(() => {
    loadTimesheetByShift(shiftId);
    return () => clearCurrentTimesheet();
  }, [shiftId]);

  const ts = currentTimesheet;
  const shift = ts?.shift;
  const doctor = ts?.doctorProfile;

  // ── Derived state ──────────────────────────────────────────────────────
  const hasClockedIn = !!ts?.clockInTime;
  const hasClockedOut = !!ts?.clockOutTime;
  const isPending = ts?.status === TimesheetStatus.PENDING_APPROVAL;

  const autoApproveDeadline = useMemo(() => {
    if (!ts?.clockOutTime) return null;
    return getAutoApproveDeadline(ts.clockOutTime);
  }, [ts?.clockOutTime]);

  const autoApproveHoursLeft = useMemo(() => {
    if (!autoApproveDeadline) return null;
    return Math.max(0, Math.ceil((autoApproveDeadline.getTime() - Date.now()) / (60 * 60 * 1000)));
  }, [autoApproveDeadline]);

  // ── Approve Handler ────────────────────────────────────────────────────
  const handleApprove = useCallback(() => {
    if (!ts) return;
    Alert.alert(
      'Approve Timesheet',
      `Approve the timesheet for Dr. ${doctor?.firstName ?? ''} ${doctor?.lastName ?? ''}?\n\nHours: ${ts.hoursWorked ?? 'N/A'}\nPay: ${ts.finalCalculatedPay ? formatPKR(ts.finalCalculatedPay) : 'N/A'}\n\nThis will trigger payment processing.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approveTimesheet(ts.id);
              Toast.show({
                type: 'success',
                text1: 'Timesheet Approved',
                text2: 'Payment will be processed shortly.',
              });
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: 'Approval Failed',
                text2: getErrorMessage(err),
              });
            }
          },
        },
      ],
    );
  }, [ts, doctor, approveTimesheet]);

  // ── Dispute Handler ────────────────────────────────────────────────────
  const handleDispute = useCallback(async () => {
    if (!ts) return;
    try {
      await disputeTimesheet(ts.id, disputeNote.trim() || undefined);
      setDisputeModalVisible(false);
      setDisputeNote('');
      Toast.show({
        type: 'success',
        text1: 'Timesheet Disputed',
        text2: 'It has been escalated for admin review.',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Dispute Failed',
        text2: getErrorMessage(err),
      });
    }
  }, [ts, disputeNote, disputeTimesheet]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (currentTimesheetLoading || !ts) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.hospital} />
      </View>
    );
  }

  const departmentLabel = shift
    ? (DEPARTMENT_OPTIONS.find((d) => d.value === shift.department)?.label ?? shift.department)
    : '';
  const specialtyLabel = doctor?.specialty
    ? (SPECIALTY_OPTIONS.find((s) => s.value === doctor.specialty)?.label ?? doctor.specialty)
    : '';

  return (
    <View style={styles.screen}>
      <LoadingOverlay visible={mutating} message="Please wait..." />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Back button ─────────────────────────────────────────────── */}
        <View style={styles.backRow}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={Colors.text}
            onPress={() => navigation.goBack()}
          />
          <Text style={[Typography.h4, { color: Colors.text, marginLeft: Spacing.md }]}>
            Review Timesheet
          </Text>
        </View>

        {/* ── Status card ─────────────────────────────────────────────── */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg(ts.status) }]}>
            <Text style={[Typography.bodySmallSemiBold, { color: statusColor(ts.status) }]}>
              {statusIcon(ts.status)} {ts.status.replace(/_/g, ' ')}
            </Text>
          </View>

          {isPending && autoApproveHoursLeft != null && autoApproveHoursLeft > 0 && (
            <View style={styles.autoApproveWarning}>
              <Ionicons name="warning" size={14} color={Colors.warning} />
              <Text style={[Typography.caption, { color: Colors.warning, marginLeft: Spacing.xs }]}>
                Auto-approves in {autoApproveHoursLeft} hours if no action is taken
              </Text>
            </View>
          )}
        </View>

        {/* ── Doctor Info ─────────────────────────────────────────────── */}
        {doctor && (
          <View style={styles.section}>
            <Text style={[Typography.captionMedium, styles.sectionLabel]}>DOCTOR</Text>
            <View style={styles.infoCard}>
              <View style={styles.doctorRow}>
                {doctor.profilePicUrl ? (
                  <Image source={{ uri: doctor.profilePicUrl }} style={styles.docAvatar} />
                ) : (
                  <View style={[styles.docAvatar, styles.docAvatarPlaceholder]}>
                    <Ionicons name="person" size={20} color={Colors.textTertiary} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={[Typography.bodySemiBold, { color: Colors.text }]}>
                    Dr. {doctor.firstName} {doctor.lastName}
                  </Text>
                  <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                    {specialtyLabel} • PMDC: {doctor.pmdcNumber}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Shift Info ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[Typography.captionMedium, styles.sectionLabel]}>SHIFT DETAILS</Text>
          <View style={styles.infoCard}>
            <Text style={[Typography.bodySemiBold, { color: Colors.text }]}>
              {shift?.title ?? 'Shift'}
            </Text>
            {shift && (
              <>
                <InfoRow icon="briefcase-outline" label={departmentLabel} />
                <InfoRow icon="calendar-outline" label={formatShiftRange(shift.startTime, shift.endTime)} />
                <InfoRow icon="cash-outline" label={`${formatPKR(shift.hourlyRate)}/hr`} />
              </>
            )}
          </View>
        </View>

        {/* ── Time Tracking ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[Typography.captionMedium, styles.sectionLabel]}>TIME TRACKING</Text>
          <View style={styles.infoCard}>
            {hasClockedIn ? (
              <InfoRow
                icon="log-in-outline"
                label={`Clocked In: ${formatDate(ts.clockInTime!)} at ${formatTime(ts.clockInTime!)}`}
              />
            ) : (
              <InfoRow icon="close-circle-outline" label="Not clocked in" />
            )}

            {ts.clockInLat != null && ts.clockInLng != null && (
              <InfoRow
                icon="location-outline"
                label={`Clock-in GPS: ${formatCoords(ts.clockInLat, ts.clockInLng)}`}
              />
            )}

            {hasClockedOut ? (
              <InfoRow
                icon="log-out-outline"
                label={`Clocked Out: ${formatDate(ts.clockOutTime!)} at ${formatTime(ts.clockOutTime!)}`}
              />
            ) : hasClockedIn ? (
              <InfoRow icon="time-outline" label="Shift in progress — not yet clocked out" />
            ) : null}

            {ts.clockOutLat != null && ts.clockOutLng != null && (
              <InfoRow
                icon="location-outline"
                label={`Clock-out GPS: ${formatCoords(ts.clockOutLat, ts.clockOutLng)}`}
              />
            )}

            {hasClockedOut && (
              <View style={styles.payRow}>
                <View style={styles.payCard}>
                  <Text style={[Typography.caption, { color: Colors.textSecondary }]}>Hours Worked</Text>
                  <Text style={[Typography.h3, { color: Colors.text }]}>
                    {formatDuration(parseFloat(ts.hoursWorked ?? '0'))}
                  </Text>
                </View>
                <View style={styles.payCard}>
                  <Text style={[Typography.caption, { color: Colors.textSecondary }]}>Total Pay</Text>
                  <Text style={[Typography.h3, { color: Colors.hospital }]}>
                    {formatPKR(ts.finalCalculatedPay ?? '0')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Dispute note (if disputed) ──────────────────────────────── */}
        {ts.status === TimesheetStatus.DISPUTED && ts.disputeNote && (
          <View style={styles.section}>
            <Text style={[Typography.captionMedium, styles.sectionLabel]}>DISPUTE DETAILS</Text>
            <View style={[styles.infoCard, { borderLeftWidth: 3, borderLeftColor: Colors.error }]}>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                {ts.disputeNote}
              </Text>
              <Text style={[Typography.caption, { color: Colors.textTertiary, marginTop: Spacing.sm }]}>
                This dispute has been escalated to the platform admin.
              </Text>
            </View>
          </View>
        )}

        {/* ── Approved summary ─────────────────────────────────────────── */}
        {ts.status === TimesheetStatus.APPROVED && (
          <View style={styles.section}>
            <View style={[styles.infoCard, { borderLeftWidth: 3, borderLeftColor: Colors.success, backgroundColor: Colors.successLight }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={[Typography.bodySmallSemiBold, { color: Colors.success, marginLeft: Spacing.sm }]}>
                  Timesheet Approved
                </Text>
              </View>
              <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.xs }]}>
                Payment of {formatPKR(ts.finalCalculatedPay ?? '0')} is being processed.
              </Text>
            </View>
          </View>
        )}

        {/* Spacer for buttons */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Bottom Action Buttons (Hospital: Approve / Dispute) ───────── */}
      {isPending && (
        <View style={styles.bottomAction}>
          <View style={styles.actionBtnRow}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <Button
                label="Approve"
                onPress={handleApprove}
                variant="primary"
                size="lg"
                fullWidth
                leftIcon="checkmark-circle-outline"
                loading={mutating}
              />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Button
                label="Dispute"
                onPress={() => setDisputeModalVisible(true)}
                variant="danger"
                size="lg"
                fullWidth
                leftIcon="alert-circle-outline"
                disabled={mutating}
              />
            </View>
          </View>
        </View>
      )}

      {/* ── Dispute Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={disputeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDisputeModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={[Typography.h4, { color: Colors.text }]}>Dispute Timesheet</Text>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: Spacing.sm }]}>
              You are disputing the timesheet for {shift?.title ?? 'this shift'}
              {doctor ? ` — Dr. ${doctor.firstName} ${doctor.lastName}` : ''}.
            </Text>

            <Text style={[Typography.bodySmallMedium, { color: Colors.text, marginTop: Spacing.lg }]}>
              Reason (optional):
            </Text>
            <TextInput
              style={styles.disputeInput}
              value={disputeNote}
              onChangeText={setDisputeNote}
              placeholder="Describe the issue..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={2000}
              textAlignVertical="top"
            />
            <Text style={[Typography.caption, { color: Colors.textTertiary, alignSelf: 'flex-end' }]}>
              {disputeNote.length}/2000
            </Text>

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color={Colors.warning} />
              <Text style={[Typography.caption, { color: Colors.warning, marginLeft: Spacing.sm, flex: 1 }]}>
                This will be escalated to the platform admin for review.
              </Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setDisputeModalVisible(false); setDisputeNote(''); }}
              >
                <Text style={[Typography.buttonSmall, { color: Colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Button
                  label="Submit Dispute"
                  onPress={handleDispute}
                  variant="danger"
                  size="md"
                  fullWidth
                  loading={mutating}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Info Row helper ──────────────────────────────────────────────────────────
function InfoRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon} size={16} color={Colors.textTertiary} />
      <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginLeft: Spacing.sm, flex: 1 }]}>
        {label}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
});

// ─── Status helpers ───────────────────────────────────────────────────────────
function statusBg(status: string): string {
  switch (status) {
    case 'PENDING_APPROVAL': return Colors.warningLight;
    case 'APPROVED': return Colors.successLight;
    case 'DISPUTED': return Colors.errorLight;
    case 'RESOLVED': return Colors.infoLight;
    default: return Colors.surfaceSecondary;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'PENDING_APPROVAL': return Colors.warning;
    case 'APPROVED': return Colors.success;
    case 'DISPUTED': return Colors.error;
    case 'RESOLVED': return Colors.info;
    default: return Colors.textSecondary;
  }
}

function statusIcon(status: string): string {
  switch (status) {
    case 'PENDING_APPROVAL': return '⏳';
    case 'APPROVED': return '✅';
    case 'DISPUTED': return '⚠️';
    case 'RESOLVED': return '✓';
    default: return '';
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl + 30,
    paddingBottom: Spacing.xxxxl,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  autoApproveWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSecondary,
  },
  docAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  payRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  payCard: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: 'center',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.md,
  },
  actionBtnRow: {
    flexDirection: 'row',
  },

  // ── Dispute Modal ─────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xxxxl,
  },
  disputeInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    minHeight: 100,
    maxHeight: 200,
    ...Typography.bodySmall,
    color: Colors.text,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  cancelBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
});
