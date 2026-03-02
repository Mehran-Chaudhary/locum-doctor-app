import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
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
import { Colors } from '../../constants/theme';
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

const PAD = 16;

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
    const clockInTime = new Date(ts.clockInTime);
    const now = new Date();
    const diffMs = now.getTime() - clockInTime.getTime();
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
        {/* ── Back row ────────────────────────────────────────────────── */}
        <View style={styles.backRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.6}>
            <Ionicons name="arrow-back" size={18} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.backTitle}>Timesheet</Text>
        </View>

        {/* ── Status pill row ─────────────────────────────────────────── */}
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: statusBg(ts.status) }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(ts.status) }]} />
            <Text style={[styles.statusLabel, { color: statusColor(ts.status) }]}>
              {statusLabel(ts.status)}
            </Text>
          </View>
          {ts.status === TimesheetStatus.PENDING_APPROVAL && autoApproveHoursLeft != null && autoApproveHoursLeft > 0 && (
            <Text style={styles.autoApprove}>Auto-approves in {autoApproveHoursLeft}h</Text>
          )}
        </View>

        {/* ── Pay highlight card ──────────────────────────────────────── */}
        {hasClockedOut && (
          <View style={styles.payHighlight}>
            <View style={styles.payCol}>
              <Text style={styles.payMeta}>Hours</Text>
              <Text style={styles.payBold}>{formatDuration(parseFloat(ts.hoursWorked ?? '0'))}</Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payCol}>
              <Text style={styles.payMeta}>Rate</Text>
              <Text style={styles.payBold}>{shift ? formatPKR(shift.hourlyRate) : '—'}/hr</Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payCol}>
              <Text style={styles.payMeta}>Total Pay</Text>
              <Text style={[styles.payBold, { color: Colors.primary }]}>
                {formatPKR(ts.finalCalculatedPay ?? '0')}
              </Text>
            </View>
          </View>
        )}

        {/* ── Live tracking card (in-progress) ────────────────────────── */}
        {hasClockedIn && !hasClockedOut && liveTimeWorked && (
          <View style={styles.payHighlight}>
            <View style={styles.payCol}>
              <Text style={styles.payMeta}>Time Worked</Text>
              <Text style={styles.payBold}>{liveTimeWorked.hours}h {liveTimeWorked.minutes}m</Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payCol}>
              <Text style={styles.payMeta}>Rate</Text>
              <Text style={styles.payBold}>{shift ? formatPKR(shift.hourlyRate) : '—'}/hr</Text>
            </View>
            {estimatedPaySoFar != null && (
              <>
                <View style={styles.payDivider} />
                <View style={styles.payCol}>
                  <Text style={styles.payMeta}>Est. Pay</Text>
                  <Text style={[styles.payBold, { color: Colors.primary }]}>{formatPKR(estimatedPaySoFar)}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Hospital card ───────────────────────────────────────────── */}
        {shift?.hospitalProfile && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="business-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.cardHeaderLabel}>HOSPITAL</Text>
            </View>
            <Text style={styles.cardTitle}>{shift.hospitalProfile.hospitalName}</Text>
            <Text style={styles.cardSub}>{shift.hospitalProfile.city}</Text>
          </View>
        )}

        {/* ── Shift details card ──────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="document-text-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.cardHeaderLabel}>SHIFT DETAILS</Text>
          </View>
          <Text style={styles.cardTitle}>{shift?.title ?? 'Shift'}</Text>
          {shift && (
            <View style={styles.detailGrid}>
              <DetailCell icon="briefcase-outline" label="Department" value={departmentLabel} />
              <DetailCell icon="calendar-outline" label="Schedule" value={formatShiftRange(shift.startTime, shift.endTime)} />
              <DetailCell icon="cash-outline" label="Hourly Rate" value={`${formatPKR(shift.hourlyRate)}/hr`} />
            </View>
          )}
        </View>

        {/* ── Clock-In Window (pre-clock-in) ──────────────────────────── */}
        {!hasClockedIn && clockInWindowInfo && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="alarm-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.cardHeaderLabel}>CLOCK-IN WINDOW</Text>
            </View>
            {clockInWindowInfo.status === 'too_early' && (
              <>
                <View style={styles.windowRow}>
                  <View style={[styles.windowIcon, { backgroundColor: Colors.warningLight }]}>
                    <Ionicons name="time-outline" size={14} color={Colors.warning} />
                  </View>
                  <Text style={[styles.windowText, { color: Colors.warning }]}>
                    Opens in {clockInWindowInfo.minutesUntilOpen} min
                  </Text>
                </View>
                <Text style={styles.windowMeta}>
                  Opens: {formatTime(clockInWindowInfo.window.earliest.toISOString())}
                  {'  •  '}
                  Closes: {formatTime(clockInWindowInfo.window.latest.toISOString())}
                </Text>
              </>
            )}
            {clockInWindowInfo.status === 'open' && (
              <View style={styles.windowRow}>
                <View style={[styles.windowIcon, { backgroundColor: Colors.successLight }]}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                </View>
                <Text style={[styles.windowText, { color: Colors.success }]}>Window is OPEN</Text>
              </View>
            )}
            {clockInWindowInfo.status === 'closed' && (
              <View style={styles.windowRow}>
                <View style={[styles.windowIcon, { backgroundColor: Colors.errorLight }]}>
                  <Ionicons name="close-circle" size={14} color={Colors.error} />
                </View>
                <Text style={[styles.windowText, { color: Colors.error }]}>Window has closed</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Time Tracking card (after clock-in) ─────────────────────── */}
        {hasClockedIn && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.cardHeaderLabel}>TIME TRACKING</Text>
            </View>
            <View style={styles.trackRow}>
              <Ionicons name="log-in-outline" size={13} color={Colors.success} />
              <Text style={styles.trackLabel}>
                In: {formatDate(ts.clockInTime!)} at {formatTime(ts.clockInTime!)}
              </Text>
            </View>
            {ts.clockInLat != null && ts.clockInLng != null && (
              <View style={styles.trackRow}>
                <Ionicons name="location-outline" size={13} color={Colors.textTertiary} />
                <Text style={styles.trackLabel}>{formatCoords(ts.clockInLat, ts.clockInLng)}</Text>
              </View>
            )}
            {hasClockedOut && (
              <>
                <View style={[styles.trackRow, { marginTop: 8 }]}>
                  <Ionicons name="log-out-outline" size={13} color={Colors.error} />
                  <Text style={styles.trackLabel}>
                    Out: {formatDate(ts.clockOutTime!)} at {formatTime(ts.clockOutTime!)}
                  </Text>
                </View>
                {ts.clockOutLat != null && ts.clockOutLng != null && (
                  <View style={styles.trackRow}>
                    <Ionicons name="location-outline" size={13} color={Colors.textTertiary} />
                    <Text style={styles.trackLabel}>{formatCoords(ts.clockOutLat, ts.clockOutLng)}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* ── Dispute section ─────────────────────────────────────────── */}
        {ts.status === TimesheetStatus.DISPUTED && ts.disputeNote && (
          <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: Colors.error }]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
              <Text style={[styles.cardHeaderLabel, { color: Colors.error }]}>DISPUTE</Text>
            </View>
            <Text style={styles.disputeText}>{ts.disputeNote}</Text>
            <Text style={styles.disputeMeta}>Under admin review</Text>
          </View>
        )}

        {/* ── Approved banner ─────────────────────────────────────────── */}
        {ts.status === TimesheetStatus.APPROVED && (
          <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: Colors.success, backgroundColor: Colors.successLight }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.approvedLabel}>Timesheet Approved</Text>
            </View>
            <Text style={styles.approvedSub}>
              Payment of {formatPKR(ts.finalCalculatedPay ?? '0')} will be processed shortly.
            </Text>
          </View>
        )}

        {/* ── Review Section ──────────────────────────────────────────── */}
        {(ts.status === TimesheetStatus.APPROVED || ts.status === 'RESOLVED') && myReviewChecked && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="star-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.cardHeaderLabel}>REVIEW</Text>
            </View>
            {myReview ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={styles.reviewedLabel}>You reviewed this hospital</Text>
                </View>
                <StarRating rating={myReview.rating} size={16} />
                {myReview.comment ? (
                  <Text style={styles.reviewComment}>"{myReview.comment}"</Text>
                ) : null}
                {!myReview.isVisible && (
                  <View style={styles.blindBanner}>
                    <Ionicons name="eye-off" size={12} color={Colors.warning} />
                    <Text style={styles.blindText}>
                      Hidden until the hospital also reviews (or {(() => { const d = Math.max(0, Math.ceil((new Date(new Date(myReview.createdAt).getTime() + APP_CONFIG.BLIND_REVIEW_DAYS * 86400000).getTime() - Date.now()) / 86400000)); return `${d} day${d !== 1 ? 's' : ''}`; })()})
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.reviewPrompt}>How was your experience at this hospital?</Text>
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
              </>
            )}
          </View>
        )}

        {/* Spacer for bottom bar */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── Bottom Action Bar ─────────────────────────────────────────── */}
      {(canClockIn || canClockOut) && (
        <View style={styles.bottomBar}>
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

// ─── Detail cell helper ───────────────────────────────────────────────────────
function DetailCell({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={detailStyles.cell}>
      <View style={detailStyles.iconWrap}>
        <Ionicons name={icon} size={12} color={Colors.textTertiary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={detailStyles.label}>{label}</Text>
        <Text style={detailStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  cell: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  iconWrap: { width: 22, alignItems: 'center', marginTop: 2 },
  label: { fontSize: 10, color: Colors.textTertiary, fontWeight: '500' },
  value: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginTop: 1 },
});

// ─── Status helpers ───────────────────────────────────────────────────────────
function statusLabel(status: string): string {
  switch (status) {
    case 'PENDING_APPROVAL': return 'Pending Approval';
    case 'APPROVED':         return 'Approved';
    case 'DISPUTED':         return 'Disputed';
    case 'RESOLVED':         return 'Resolved';
    default:                 return status;
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'PENDING_APPROVAL': return Colors.warningLight;
    case 'APPROVED':         return Colors.successLight;
    case 'DISPUTED':         return Colors.errorLight;
    case 'RESOLVED':         return Colors.infoLight;
    default:                 return Colors.surfaceSecondary;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'PENDING_APPROVAL': return Colors.warning;
    case 'APPROVED':         return Colors.success;
    case 'DISPUTED':         return Colors.error;
    case 'RESOLVED':         return Colors.info;
    default:                 return Colors.textSecondary;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: {
    paddingHorizontal: PAD,
    paddingTop: 54,
    paddingBottom: 40,
  },

  /* ── Back row ────────────────────────────────────────────────────────── */
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 10,
  },

  /* ── Status pill row ─────────────────────────────────────────────────── */
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  autoApprove: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.warning,
  },

  /* ── Pay highlight card ──────────────────────────────────────────────── */
  payHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  payCol: { flex: 1, alignItems: 'center' },
  payMeta: { fontSize: 10, fontWeight: '500', color: Colors.textTertiary, marginBottom: 2 },
  payBold: { fontSize: 14, fontWeight: '700', color: Colors.text },
  payDivider: { width: 1, height: 28, backgroundColor: Colors.borderLight },

  /* ── Generic card ────────────────────────────────────────────────────── */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 14,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  cardHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  /* ── Detail grid ─────────────────────────────────────────────────────── */
  detailGrid: { marginTop: 4 },

  /* ── Clock-in window ─────────────────────────────────────────────────── */
  windowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  windowIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  windowText: {
    fontSize: 13,
    fontWeight: '600',
  },
  windowMeta: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 6,
  },

  /* ── Time tracking rows ──────────────────────────────────────────────── */
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  trackLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },

  /* ── Dispute ─────────────────────────────────────────────────────────── */
  disputeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  disputeMeta: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 6,
  },

  /* ── Approved banner ─────────────────────────────────────────────────── */
  approvedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 6,
  },
  approvedSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  /* ── Review section ──────────────────────────────────────────────────── */
  reviewedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 6,
  },
  reviewComment: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 6,
  },
  reviewPrompt: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  blindBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: Colors.warningLight,
    borderRadius: 8,
    padding: 8,
    gap: 6,
  },
  blindText: {
    fontSize: 11,
    color: Colors.warning,
    flex: 1,
  },

  /* ── Bottom bar ──────────────────────────────────────────────────────── */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: PAD,
    paddingVertical: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});
