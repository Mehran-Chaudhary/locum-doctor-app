import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useAdminStore } from '../../stores/admin.store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import { formatDate, formatTime, formatPKR, formatShiftRange } from '../../utils/date';
import { getErrorMessage } from '../../utils/error';
import type { AdminDispute } from '../../types';

export default function AdminDisputeResolveScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const timesheetId: string = route.params?.timesheetId;

  const { disputes, mutating, resolveDispute, loadDisputes } = useAdminStore();
  const dispute = disputes.find((d) => d.id === timesheetId);

  const [action, setAction] = useState<'APPROVE' | 'RESOLVE'>('APPROVE');
  const [overrideClockIn, setOverrideClockIn] = useState('');
  const [overrideClockOut, setOverrideClockOut] = useState('');

  if (!dispute) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="document-outline" size={48} color={Colors.textTertiary} />
          <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: Spacing.lg }]}>
            Dispute not found
          </Text>
          <Button label="Go Back" onPress={() => navigation.goBack()} variant="outline" size="sm" style={{ marginTop: Spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const handleResolve = () => {
    const actionLabel = action === 'APPROVE' ? 'Approve as-is' : 'Resolve with overrides';
    Alert.alert(
      'Confirm Resolution',
      `Action: ${actionLabel}. This cannot be undone. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await resolveDispute(timesheetId, {
                action,
                overrideClockIn: action === 'RESOLVE' && overrideClockIn ? overrideClockIn : null,
                overrideClockOut: action === 'RESOLVE' && overrideClockOut ? overrideClockOut : null,
              });
              Toast.show({ type: 'success', text1: 'Dispute Resolved', text2: `Timesheet ${action === 'APPROVE' ? 'approved' : 'resolved'} successfully.` });
              navigation.goBack();
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(error) });
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <Button label="Back" onPress={() => navigation.goBack()} variant="ghost" size="sm" leftIcon="arrow-back" />

        <Text style={styles.heading}>Resolve Dispute</Text>

        {/* Shift Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shift Details</Text>
          <InfoLine icon="briefcase-outline" label="Title" value={dispute.shift.title} />
          <InfoLine icon="layers-outline" label="Department" value={dispute.shift.department.replace(/_/g, ' ')} />
          <InfoLine icon="calendar-outline" label="Scheduled" value={formatShiftRange(dispute.shift.startTime, dispute.shift.endTime)} />
          <InfoLine icon="cash-outline" label="Hourly Rate" value={formatPKR(dispute.shift.hourlyRate)} last />
        </View>

        {/* Parties */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parties</Text>
          <InfoLine
            icon="person-outline"
            label="Doctor"
            value={`Dr. ${dispute.doctorProfile.firstName} ${dispute.doctorProfile.lastName} (${dispute.doctorProfile.pmdcNumber})`}
          />
          <InfoLine
            icon="business-outline"
            label="Hospital"
            value={dispute.hospitalProfile.hospitalName}
            last
          />
        </View>

        {/* Clock Times Comparison */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Clock Times</Text>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonCol}>
              <Text style={styles.compLabel}>Scheduled In</Text>
              <Text style={styles.compValue}>{formatTime(dispute.shift.startTime)}</Text>
            </View>
            <View style={styles.comparisonCol}>
              <Text style={styles.compLabel}>Actual In</Text>
              <Text style={[styles.compValue, { color: Colors.primary }]}>
                {dispute.clockInTime ? formatTime(dispute.clockInTime) : 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonCol}>
              <Text style={styles.compLabel}>Scheduled Out</Text>
              <Text style={styles.compValue}>{formatTime(dispute.shift.endTime)}</Text>
            </View>
            <View style={styles.comparisonCol}>
              <Text style={styles.compLabel}>Actual Out</Text>
              <Text style={[styles.compValue, { color: Colors.primary }]}>
                {dispute.clockOutTime ? formatTime(dispute.clockOutTime) : 'N/A'}
              </Text>
            </View>
          </View>
          {dispute.hoursWorked && (
            <InfoLine icon="time-outline" label="Hours Worked" value={`${parseFloat(dispute.hoursWorked).toFixed(2)} hrs`} />
          )}
          {dispute.finalCalculatedPay && (
            <InfoLine icon="cash-outline" label="Calculated Pay" value={formatPKR(dispute.finalCalculatedPay)} last />
          )}
        </View>

        {/* Dispute Note */}
        {dispute.disputeNote && (
          <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: Colors.warning }]}>
            <Text style={styles.cardTitle}>Dispute Reason</Text>
            <Text style={styles.noteText}>{dispute.disputeNote}</Text>
          </View>
        )}

        {/* Resolution Action */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resolution Action</Text>

          {/* Action Toggle */}
          <View style={styles.toggleRow}>
            <Button
              label="Approve As-Is"
              onPress={() => setAction('APPROVE')}
              variant={action === 'APPROVE' ? 'primary' : 'outline'}
              size="sm"
              style={{ flex: 1 }}
            />
            <Button
              label="Override Times"
              onPress={() => setAction('RESOLVE')}
              variant={action === 'RESOLVE' ? 'primary' : 'outline'}
              size="sm"
              style={{ flex: 1 }}
            />
          </View>

          {action === 'APPROVE' && (
            <Text style={styles.actionDesc}>
              Accept the timesheet as-is. Hours and pay will remain unchanged. Status → APPROVED.
            </Text>
          )}

          {action === 'RESOLVE' && (
            <>
              <Text style={styles.actionDesc}>
                Override clock-in/out times. Hours and pay will be recalculated. Status → RESOLVED.
              </Text>
              <Text style={styles.inputHint}>
                Enter ISO 8601 datetime (e.g. 2025-07-15T20:30:00.000Z)
              </Text>
              <Input
                label="Override Clock In"
                value={overrideClockIn}
                onChangeText={setOverrideClockIn}
                placeholder="e.g. 2025-07-15T20:30:00.000Z"
                leftIcon="log-in-outline"
                containerStyle={{ marginBottom: Spacing.md }}
              />
              <Input
                label="Override Clock Out"
                value={overrideClockOut}
                onChangeText={setOverrideClockOut}
                placeholder="e.g. 2025-07-16T07:55:00.000Z"
                leftIcon="log-out-outline"
              />
            </>
          )}
        </View>

        {/* Submit */}
        <Button
          label={action === 'APPROVE' ? 'Approve Timesheet' : 'Resolve with Overrides'}
          onPress={handleResolve}
          variant="primary"
          fullWidth
          loading={mutating}
          leftIcon={action === 'APPROVE' ? 'checkmark-circle-outline' : 'create-outline'}
          style={{ marginTop: Spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-Component ────────────────────────────────────────────────────────────
function InfoLine({ icon, label, value, last = false }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[infoStyles.row, !last && infoStyles.bordered]}>
      <Ionicons name={icon} size={16} color={Colors.textTertiary} />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  bordered: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  label: { ...Typography.bodySmallMedium, color: Colors.textSecondary, marginLeft: Spacing.sm, width: 100 },
  value: { ...Typography.bodySmall, color: Colors.text, flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  scroll: { padding: Layout.screenPadding, paddingBottom: 40 },
  heading: {
    ...Typography.h3,
    color: Colors.text,
    marginVertical: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  cardTitle: {
    ...Typography.bodySemiBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  comparisonRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  comparisonCol: {
    flex: 1,
  },
  compLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  compValue: {
    ...Typography.bodySmallMedium,
    color: Colors.text,
  },
  noteText: {
    ...Typography.bodySmall,
    color: Colors.text,
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  inputHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
});
