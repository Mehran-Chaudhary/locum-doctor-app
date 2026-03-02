import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { useApplicationStore } from '../../stores/application.store';
import StatusFilterBar, { FilterTab } from '../../components/shifts/StatusFilterBar';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import { ApplicationStatus, SPECIALTY_OPTIONS } from '../../constants/enums';
import { formatShiftRangeCompact, formatPKR } from '../../utils/date';
import { getErrorMessage } from '../../utils/error';
import type { ShiftApplication } from '../../types';

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const TABS: FilterTab[] = [
  { key: 'ALL', label: 'All' },
  { key: 'APPLIED', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'REJECTED', label: 'Past' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function MyApplicationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { myApplications, myApplicationsLoading, loadMyApplications, withdrawApplication, mutating } =
    useApplicationStore();

  const [activeTab, setActiveTab] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // ── Load ───────────────────────────────────────────────────────────────
  useEffect(() => {
    loadMyApplications();
  }, []);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      if (tab === 'ALL') {
        loadMyApplications();
      } else {
        loadMyApplications(tab as any);
      }
    },
    [loadMyApplications],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'ALL') {
      await loadMyApplications();
    } else {
      await loadMyApplications(activeTab as any);
    }
    setRefreshing(false);
  }, [activeTab, loadMyApplications]);

  // ── Withdraw ───────────────────────────────────────────────────────────
  const handleWithdraw = useCallback(
    (app: ShiftApplication) => {
      Alert.alert(
        'Withdraw Application',
        `Are you sure you want to withdraw your application for "${app.shift?.title ?? 'this shift'}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Withdraw',
            style: 'destructive',
            onPress: async () => {
              try {
                await withdrawApplication(app.id);
                Toast.show({ type: 'success', text1: 'Withdrawn', text2: 'Application withdrawn successfully.' });
              } catch (err) {
                Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) });
              }
            },
          },
        ],
      );
    },
    [withdrawApplication],
  );

  // ── Navigate to shift detail ───────────────────────────────────────────
  const handleViewShift = useCallback(
    (shiftId: string) => {
      navigation.navigate('ShiftDetail', { shiftId });
    },
    [navigation],
  );

  // ── Render card ────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: ShiftApplication }) => {
      const shift = item.shift;
      const hospital = shift?.hospitalProfile;
      const isPending = item.status === ApplicationStatus.APPLIED;
      const isAccepted = item.status === ApplicationStatus.ACCEPTED;

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => shift && handleViewShift(shift.id)}
          activeOpacity={0.7}
        >
          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: appStatusBg(item.status) }]}>
            <Text style={[Typography.captionMedium, { color: appStatusColor(item.status) }]}>
              {appStatusLabel(item.status)}
            </Text>
          </View>

          {/* Shift info */}
          <Text style={[Typography.bodySemiBold, { color: Colors.text, marginTop: Spacing.sm }]} numberOfLines={1}>
            {shift?.title ?? 'Shift'}
          </Text>

          {hospital && (
            <View style={styles.hospitalRow}>
              {hospital.logoUrl ? (
                <Image source={{ uri: hospital.logoUrl }} style={styles.hospitalLogo} />
              ) : (
                <View style={[styles.hospitalLogo, styles.hospitalLogoPlaceholder]}>
                  <Ionicons name="business" size={10} color={Colors.textTertiary} />
                </View>
              )}
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                {hospital.hospitalName}, {hospital.city}
              </Text>
            </View>
          )}

          {shift && (
            <View style={styles.scheduleRow}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textTertiary} />
              <Text
                style={[Typography.caption, { color: Colors.textSecondary, marginLeft: 6, flex: 1 }]}
              >
                {formatShiftRangeCompact(shift.startTime, shift.endTime)}
              </Text>
              <Text style={[Typography.captionMedium, { color: Colors.primary }]}>
                {formatPKR(shift.totalEstimatedPay)}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {isPending && (
              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={() => handleWithdraw(item)}
                disabled={mutating}
              >
                <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
                <Text style={[Typography.buttonSmall, { color: Colors.error, marginLeft: 4 }]}>
                  Withdraw
                </Text>
              </TouchableOpacity>
            )}
            {isAccepted && (
              <View style={styles.acceptedLabel}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={[Typography.buttonSmall, { color: Colors.success, marginLeft: 4 }]}>
                  View Shift →
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [handleViewShift, handleWithdraw, mutating],
  );

  const renderEmpty = useCallback(() => {
    if (myApplicationsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="paper-plane-outline" size={56} color={Colors.textTertiary} />
        <Text style={[Typography.h4, { color: Colors.text, marginTop: Spacing.lg }]}>
          No applications yet
        </Text>
        <Text
          style={[
            Typography.bodySmall,
            { color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
          ]}
        >
          Browse available shifts and apply to get started.
        </Text>
      </View>
    );
  }, [myApplicationsLoading]);

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={[Typography.h3, { color: Colors.text }]}>My Applications</Text>
      </View>

      {/* ── Filter tabs ─────────────────────────────────────────────────── */}
      <StatusFilterBar tabs={TABS} activeKey={activeTab} onChange={handleTabChange} />

      {/* ── List ─────────────────────────────────────────────────────────── */}
      {myApplicationsLoading && myApplications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={myApplications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function appStatusLabel(status: string): string {
  switch (status) {
    case 'APPLIED': return '⏳ Pending';
    case 'ACCEPTED': return '✅ Accepted';
    case 'REJECTED': return 'Not Selected';
    case 'WITHDRAWN': return 'Withdrawn';
    default: return status;
  }
}

function appStatusBg(status: string): string {
  switch (status) {
    case 'APPLIED': return Colors.warningLight;
    case 'ACCEPTED': return Colors.successLight;
    case 'REJECTED': return Colors.surfaceSecondary;
    case 'WITHDRAWN': return Colors.surfaceSecondary;
    default: return Colors.surfaceSecondary;
  }
}

function appStatusColor(status: string): string {
  switch (status) {
    case 'APPLIED': return Colors.warning;
    case 'ACCEPTED': return Colors.success;
    case 'REJECTED': return Colors.textTertiary;
    case 'WITHDRAWN': return Colors.textTertiary;
    default: return Colors.textSecondary;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl + 30,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxxxl,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  hospitalLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: Colors.surfaceSecondary,
  },
  hospitalLogoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.md,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.errorLight,
  },
  acceptedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  emptyContainer: {
    paddingTop: Spacing.xxxxl * 2,
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
});
