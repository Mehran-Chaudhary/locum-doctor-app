import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { useTimesheetStore } from '../../stores/timesheet.store';
import { useReviewStore } from '../../stores/review.store';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import StarRating from '../../components/reviews/StarRating';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import { TimesheetStatus, DEPARTMENT_OPTIONS } from '../../constants/enums';
import {
  formatShiftRange,
  formatTime,
  formatDate,
  formatPKR,
  formatDuration,
} from '../../utils/date';
import {
  getCurrentLocation,
  formatCoords,
  checkGeoFence,
  getClockInWindowStatus,
  getAutoApproveDeadline,
  formatDistance,
} from '../../utils/location';
import { getErrorMessage } from '../../utils/error';
import { APP_CONFIG } from '../../constants/config';

// ─── Route params ─────────────────────────────────────────────────────────────
type Params = { TimesheetDetail: { shiftId: string } };

// ─── Component ────────────────────────────────────────────────────────────────
export default function TimesheetDetailScreen() {
  const route = useRoute<RouteProp<Params, 'TimesheetDetail'>>();
  const navigation = useNavigation();
  const { shiftId } = route.params;

  const {
    currentTimesheet,
    currentTimesheetLoading,
    loadTimesheetByShift,
    clearCurrentTimesheet,
    clockIn,
    clockOut,
    mutating,
  } = useTimesheetStore();

  const { myReview, myReviewChecked, checkMyReview, clearMyReview } = useReviewStore();

  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadTimesheetByShift(shiftId);
    return () => { clearCurrentTimesheet(); clearMyReview(); };
  }, [shiftId]);

  // Check review status when timesheet is approved/resolved
  const ts0 = useTimesheetStore((s) => s.currentTimesheet);
  useEffect(() => {
    if (ts0 && (ts0.status === TimesheetStatus.APPROVED || ts0.status === 'RESOLVED')) {
      checkMyReview(ts0.id);
    }
  }, [ts0?.id, ts0?.status]);

  const ts = currentTimesheet;
  const shift = ts?.shift;

  // ── Derived state ──────────────────────────────────────────────────────
  const hasClockedIn = !!ts?.clockInTime;
  const hasClockedOut = !!ts?.clockOutTime;

  const clockInWindowInfo = useMemo(() => {
    if (!shift?.startTime) return null;
    return getClockInWindowStatus(shift.startTime);
  }, [shift?.startTime]);

  const autoApproveDeadline = useMemo(() => {
    if (!ts?.clockOutTime) return null;
    return getAutoApproveDeadline(ts.clockOutTime);
  }, [ts?.clockOutTime]);

  const autoApproveHoursLeft = useMemo(() => {
    if (!autoApproveDeadline) return null;
    return Math.max(0, Math.ceil((autoApproveDeadline.getTime() - Date.now()) / (60 * 60 * 1000)));
  }, [autoApproveDeadline]);

  // Live "time worked so far" for in-progress shifts
  const liveTimeWorked = useMemo(() => {
    if (!ts?.clockInTime || ts?.clockOutTime) return null;
    const clockIn = new Date(ts.clockInTime);
    const now = new Date();
    const diffMs = now.getTime() - clockIn.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  }, [ts?.clockInTime, ts?.clockOutTime]);

  const estimatedPaySoFar = useMemo(() => {
    if (!liveTimeWorked || !shift?.hourlyRate) return null;
    const totalHours = liveTimeWorked.hours + liveTimeWorked.minutes / 60;
    return totalHours * parseFloat(shift.hourlyRate);
  }, [liveTimeWorked, shift?.hourlyRate]);

  // ── Clock In Handler ───────────────────────────────────────────────────
  const handleClockIn = useCallback(async () => {
    setGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert(
          'Location Required',
          'GPS location is required to clock in. Please enable location services and grant permission.',
        );
        setGettingLocation(false);
        return;
      }

      setGettingLocation(false);

      // Client-side geo-fence preview
      const hospitalLat = shift?.hospitalProfile?.address ? null : null; // We don't have lat/lng here
      // The server does the real validation — proceed with API call

      await clockIn(shiftId, location.latitude, location.longitude);
      Toast.show({
        type: 'success',
        text1: 'Clocked In!',
        text2: 'Your shift has started. Good luck!',
      });
    } catch (err) {
      setGettingLocation(false);
      Toast.show({
        type: 'error',
        text1: 'Clock-In Failed',
        text2: getErrorMessage(err),
      });
    }
  }, [shiftId, clockIn, shift]);

  // ── Clock Out Handler ──────────────────────────────────────────────────
  const handleClockOut = useCallback(() => {
    Alert.alert(
      'Confirm Clock Out',
      'Are you sure you want to clock out and end your shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clock Out',
          onPress: async () => {
            setGettingLocation(true);
            try {
              const location = await getCurrentLocation();
              if (!location) {
                Alert.alert(
                  'Location Required',
                  'GPS location is required for clock-out records. Please enable location services.',
                );
                setGettingLocation(false);
                return;
              }

              setGettingLocation(false);

              const result = await clockOut(shiftId, location.latitude, location.longitude);
              Toast.show({
                type: 'success',
                text1: 'Clocked Out!',
                text2: `Shift completed. Hours: ${result.hoursWorked}. Pay: ${formatPKR(result.finalCalculatedPay)}`,
              });
            } catch (err) {
              setGettingLocation(false);
              Toast.show({
                type: 'error',
                text1: 'Clock-Out Failed',
                text2: getErrorMessage(err),
              });
            }
          },
        },
      ],
    );
  }, [shiftId, clockOut]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (currentTimesheetLoading || !ts) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const departmentLabel = shift
    ? (DEPARTMENT_OPTIONS.find((d) => d.value === shift.department)?.label ?? shift.department)
    : '';

  // ── Can clock in? ──────────────────────────────────────────────────────
  const canClockIn = !hasClockedIn && clockInWindowInfo?.status === 'open';
  const canClockOut = hasClockedIn && !hasClockedOut;

  return (
    <View style={styles.screen}>
      <LoadingOverlay visible={gettingLocation || mutating} message={gettingLocation ? 'Getting location...' : 'Please wait...'} />

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
            Timesheet
          </Text>
        </View>

        {/* ── Status card ─────────────────────────────────────────────── */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: timesheetStatusBg(ts.status) }]}>
            <Text style={[Typography.bodySmallSemiBold, { color: timesheetStatusColor(ts.status) }]}>
              {timesheetStatusIcon(ts.status)} {ts.status.replace(/_/g, ' ')}
            </Text>
          </View>

          {ts.status === TimesheetStatus.PENDING_APPROVAL && autoApproveHoursLeft != null && autoApproveHoursLeft > 0 && (
            <Text style={[Typography.caption, { color: Colors.warning, marginTop: Spacing.xs }]}>
              Auto-approves in {autoApproveHoursLeft} hours
            </Text>
          )}
        </View>

        {/* ── Shift Info ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[Typography.captionMedium, styles.sectionLabel]}>SHIFT DETAILS</Text>
          <View style={styles.infoCard}>
            <Text style={[Typography.bodySemiBold, { color: Colors.text }]}>
              {shift?.title ?? 'Shift'}
            </Text>
            {shift?.hospitalProfile && (
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>
                {shift.hospitalProfile.hospitalName}, {shift.hospitalProfile.city}
              </Text>
            )}
            {shift && (
              <>
                <InfoRow icon="briefcase-outline" label={departmentLabel} />
                <InfoRow icon="calendar-outline" label={formatShiftRange(shift.startTime, shift.endTime)} />
                <InfoRow icon="cash-outline" label={`${formatPKR(shift.hourlyRate)}/hr`} />
              </>
            )}
          </View>
        </View>

        {/* ── Clock-In Window (pre-clock-in state) ────────────────────── */}
        {!hasClockedIn && clockInWindowInfo && (
          <View style={styles.section}>
            <Text style={[Typography.captionMedium, styles.sectionLabel]}>CLOCK-IN WINDOW</Text>
            <View style={styles.infoCard}>
              {clockInWindowInfo.status === 'too_early' && (
                <>
                  <View style={styles.windowRow}>
                    <Ionicons name="time-outline" size={18} color={Colors.warning} />
                    <Text style={[Typography.bodySmallMedium, { color: Colors.warning, marginLeft: Spacing.sm }]}>
                      Clock-in opens in {clockInWindowInfo.minutesUntilOpen} min
                    </Text>
                  </View>
                  <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.xs }]}>
                    Opens: {formatTime(clockInWindowInfo.window.earliest.toISOString())}
                    {'  •  '}
                    Closes: {formatTime(clockInWindowInfo.window.latest.toISOString())}
                  </Text>
                </>
              )}
              {clockInWindowInfo.status === 'open' && (
                <View style={styles.windowRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={[Typography.bodySmallMedium, { color: Colors.success, marginLeft: Spacing.sm }]}>
                    Clock-in window is OPEN
                  </Text>
                </View>
              )}
              {clockInWindowInfo.status === 'closed' && (
                <View style={styles.windowRow}>
                  <Ionicons name="close-circle" size={18} color={Colors.error} />
                  <Text style={[Typography.bodySmallMedium, { color: Colors.error, marginLeft: Spacing.sm }]}>
                    Clock-in window has closed
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Time Tracking (after clock-in) ──────────────────────────── */}
        {hasClockedIn && (
          <View style={styles.section}>
            <Text style={[Typography.captionMedium, styles.sectionLabel]}>TIME TRACKING</Text>
            <View style={styles.infoCard}>
              <InfoRow
                icon="log-in-outline"
                label={`Clocked In: ${formatDate(ts.clockInTime!)} at ${formatTime(ts.clockInTime!)}`}
              />
              {ts.clockInLat != null && ts.clockInLng != null && (
                <InfoRow
                  icon="location-outline"
                  label={`Clock-in location: ${formatCoords(ts.clockInLat, ts.clockInLng)}`}
                />
              )}

              {hasClockedOut ? (
                <>
                  <InfoRow
                    icon="log-out-outline"
                    label={`Clocked Out: ${formatDate(ts.clockOutTime!)} at ${formatTime(ts.clockOutTime!)}`}
                  />
                  {ts.clockOutLat != null && ts.clockOutLng != null && (
                    <InfoRow
                      icon="location-outline"
                      label={`Clock-out location: ${formatCoords(ts.clockOutLat, ts.clockOutLng)}`}
                    />
                  )}
                  <View style={styles.payRow}>
                    <View style={styles.payCard}>
                      <Text style={[Typography.caption, { color: Colors.textSecondary }]}>Hours Worked</Text>
                      <Text style={[Typography.h3, { color: Colors.text }]}>
                        {formatDuration(parseFloat(ts.hoursWorked ?? '0'))}
                      </Text>
                    </View>
                    <View style={styles.payCard}>
                      <Text style={[Typography.caption, { color: Colors.textSecondary }]}>Total Pay</Text>
                      <Text style={[Typography.h3, { color: Colors.primary }]}>
                        {formatPKR(ts.finalCalculatedPay ?? '0')}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                /* Live tracking for in-progress shift */
                liveTimeWorked && (
                  <View style={styles.payRow}>
                    <View style={styles.payCard}>
                      <Text style={[Typography.caption, { color: Colors.textSecondary }]}>Time Worked</Text>
                      <Text style={[Typography.h3, { color: Colors.text }]}>
                        {liveTimeWorked.hours}h {liveTimeWorked.minutes}m
                      </Text>
                    </View>
                    {estimatedPaySoFar != null && (
                      <View style={styles.payCard}>
                        <Text style={[Typography.caption, { color: Colors.textSecondary }]}>Est. Pay</Text>
                        <Text style={[Typography.h3, { color: Colors.primary }]}>
                          {formatPKR(estimatedPaySoFar)}
                        </Text>
                      </View>
                    )}
                  </View>
                )
              )}
            </View>
          </View>
        )}

        {/* ── Dispute section ─────────────────────────────────────────── */}
        {ts.status === TimesheetStatus.DISPUTED && ts.disputeNote && (
          <View style={styles.section}>
            <Text style={[Typography.captionMedium, styles.sectionLabel]}>DISPUTE DETAILS</Text>
            <View style={[styles.infoCard, { borderLeftWidth: 3, borderLeftColor: Colors.error }]}>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                {ts.disputeNote}
              </Text>
              <Text style={[Typography.caption, { color: Colors.textTertiary, marginTop: Spacing.sm }]}>
                This dispute is under admin review.
              </Text>
            </View>
          </View>
        )}

        {/* ── Approved summary ────────────────────────────────────────── */}
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
                Payment of {formatPKR(ts.finalCalculatedPay ?? '0')} will be processed shortly.
              </Text>
            </View>
          </View>
        )}

        {/* ── Review Section (after APPROVED or RESOLVED) ─────────────── */}
        {(ts.status === TimesheetStatus.APPROVED || ts.status === 'RESOLVED') && myReviewChecked && (
          <View style={styles.section}>
            <Text style={[Typography.captionMedium, styles.sectionLabel]}>REVIEW</Text>
            {myReview ? (
              <View style={styles.infoCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={[Typography.bodySmallSemiBold, { color: Colors.success, marginLeft: Spacing.sm }]}>
                    You reviewed this hospital
                  </Text>
                </View>
                <StarRating rating={myReview.rating} size={18} />
                {myReview.comment ? (
                  <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: Spacing.sm, fontStyle: 'italic' }]}>
                    "{myReview.comment}"
                  </Text>
                ) : null}
                {!myReview.isVisible && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, backgroundColor: Colors.warningLight, borderRadius: BorderRadius.sm, padding: Spacing.sm }}>
                    <Ionicons name="eye-off" size={14} color={Colors.warning} />
                    <Text style={[Typography.caption, { color: Colors.warning, marginLeft: Spacing.xs, flex: 1 }]}>
                      Hidden until the hospital also reviews (or {(() => { const d = Math.max(0, Math.ceil((new Date(new Date(myReview.createdAt).getTime() + APP_CONFIG.BLIND_REVIEW_DAYS * 86400000).getTime() - Date.now()) / 86400000)); return `${d} day${d !== 1 ? 's' : ''}`; })()})
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.infoCard}>
                <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginBottom: Spacing.md }]}>
                  How was your experience at this hospital?
                </Text>
                <Button
                  label="Leave a Review"
                  onPress={() => (navigation as any).navigate('SubmitReview', {
                    timesheetId: ts.id,
                    shiftTitle: shift?.title ?? 'Shift',
                    entityName: shift?.hospitalProfile?.hospitalName ?? 'Hospital',
                    shiftDate: shift ? formatDate(shift.startTime) : undefined,
                  })}
                  variant="outline"
                  size="md"
                  fullWidth
                  leftIcon="star-outline"
                />
              </View>
            )}
          </View>
        )}

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Action Button ──────────────────────────────────────── */}
      {(canClockIn || canClockOut) && (
        <View style={styles.bottomAction}>
          {canClockIn && (
            <Button
              label="CLOCK IN"
              onPress={handleClockIn}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon="log-in-outline"
              loading={mutating || gettingLocation}
              disabled={clockInWindowInfo?.status !== 'open'}
            />
          )}
          {canClockOut && (
            <Button
              label="CLOCK OUT"
              onPress={handleClockOut}
              variant="danger"
              size="lg"
              fullWidth
              leftIcon="log-out-outline"
              loading={mutating || gettingLocation}
            />
          )}
        </View>
      )}
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
function timesheetStatusBg(status: string): string {
  switch (status) {
    case 'PENDING_APPROVAL': return Colors.warningLight;
    case 'APPROVED': return Colors.successLight;
    case 'DISPUTED': return Colors.errorLight;
    case 'RESOLVED': return Colors.infoLight;
    default: return Colors.surfaceSecondary;
  }
}

function timesheetStatusColor(status: string): string {
  switch (status) {
    case 'PENDING_APPROVAL': return Colors.warning;
    case 'APPROVED': return Colors.success;
    case 'DISPUTED': return Colors.error;
    case 'RESOLVED': return Colors.info;
    default: return Colors.textSecondary;
  }
}

function timesheetStatusIcon(status: string): string {
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
  windowRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
