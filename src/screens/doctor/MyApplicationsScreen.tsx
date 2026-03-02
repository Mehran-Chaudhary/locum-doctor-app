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
import { Colors, Spacing } from '../../constants/theme';
import { ApplicationStatus } from '../../constants/enums';
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
          activeOpacity={0.6}
        >
          {/* Left accent strip */}
          <View style={[styles.accent, { backgroundColor: appStatusAccent(item.status) }]} />

          <View style={styles.cardContent}>
            {/* Row 1: Title + Total Pay */}
            <View style={styles.rowSpread}>
              <Text style={styles.shiftTitle} numberOfLines={1}>
                {shift?.title ?? 'Shift'}
              </Text>
              {shift && (
                <Text style={styles.payText}>{formatPKR(shift.totalEstimatedPay)}</Text>
              )}
            </View>

            {/* Row 2: Hospital */}
            {hospital && (
              <View style={styles.infoRow}>
                {hospital.logoUrl ? (
                  <Image source={{ uri: hospital.logoUrl }} style={styles.logo} />
                ) : (
                  <View style={[styles.logo, styles.logoFallback]}>
                    <Ionicons name="business" size={8} color={Colors.textTertiary} />
                  </View>
                )}
                <Text style={styles.hospitalLabel} numberOfLines={1}>
                  {hospital.hospitalName}, {hospital.city}
                </Text>
              </View>
            )}

            {/* Row 3: Schedule */}
            {shift && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={11} color={Colors.textTertiary} />
                <Text style={styles.scheduleLabel}>
                  {formatShiftRangeCompact(shift.startTime, shift.endTime)}
                </Text>
              </View>
            )}

            {/* Row 4: Status badge + Action */}
            <View style={styles.rowSpread}>
              <View style={[styles.statusPill, { backgroundColor: appStatusBg(item.status) }]}>
                <View style={[styles.statusDot, { backgroundColor: appStatusColor(item.status) }]} />
                <Text style={[styles.statusText, { color: appStatusColor(item.status) }]}>
                  {appStatusLabel(item.status)}
                </Text>
              </View>

              {isPending && (
                <TouchableOpacity
                  style={styles.withdrawBtn}
                  onPress={() => handleWithdraw(item)}
                  disabled={mutating}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={12} color={Colors.error} />
                  <Text style={styles.withdrawText}>Withdraw</Text>
                </TouchableOpacity>
              )}
              {isAccepted && (
                <View style={styles.viewShiftTag}>
                  <Text style={styles.viewShiftText}>View Shift</Text>
                  <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
                </View>
              )}
            </View>
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
        <Ionicons name="paper-plane-outline" size={44} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>No applications yet</Text>
        <Text style={styles.emptySubtitle}>
          Browse available shifts and apply to get started.
        </Text>
      </View>
    );
  }, [myApplicationsLoading]);

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Applications</Text>
        {myApplications.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{myApplications.length}</Text>
          </View>
        )}
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
    case 'APPLIED':   return 'Pending';
    case 'ACCEPTED':  return 'Accepted';
    case 'REJECTED':  return 'Not Selected';
    case 'WITHDRAWN': return 'Withdrawn';
    default:          return status;
  }
}

function appStatusBg(status: string): string {
  switch (status) {
    case 'APPLIED':   return Colors.warningLight;
    case 'ACCEPTED':  return Colors.successLight;
    case 'REJECTED':  return Colors.surfaceSecondary;
    case 'WITHDRAWN': return Colors.surfaceSecondary;
    default:          return Colors.surfaceSecondary;
  }
}

function appStatusColor(status: string): string {
  switch (status) {
    case 'APPLIED':   return Colors.warning;
    case 'ACCEPTED':  return Colors.success;
    case 'REJECTED':  return Colors.textTertiary;
    case 'WITHDRAWN': return Colors.textTertiary;
    default:          return Colors.textSecondary;
  }
}

function appStatusAccent(status: string): string {
  switch (status) {
    case 'APPLIED':   return Colors.warning;
    case 'ACCEPTED':  return Colors.success;
    case 'REJECTED':  return Colors.textTertiary;
    case 'WITHDRAWN': return Colors.disabled;
    default:          return Colors.border;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const PAD = 14;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Header ──────────────────────────────────────────────────────────────── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingTop: Spacing.xxl + 30,
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },

  /* ── List ─────────────────────────────────────────────────────────────────── */
  listContent: {
    paddingHorizontal: PAD,
    paddingTop: 6,
    paddingBottom: Spacing.xxxxl,
  },

  /* ── Card ─────────────────────────────────────────────────────────────────── */
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
  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  /* ── Row layouts ─────────────────────────────────────────────────────────── */
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
  shiftTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 10,
  },
  payText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  /* ── Row 2: Hospital ─────────────────────────────────────────────────────── */
  logo: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 5,
    backgroundColor: Colors.surfaceSecondary,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    flexShrink: 1,
  },

  /* ── Row 3: Schedule ─────────────────────────────────────────────────────── */
  scheduleLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 4,
  },

  /* ── Row 4: Status + Actions ─────────────────────────────────────────────── */
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
    marginTop: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginTop: 6,
  },
  withdrawText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.error,
  },
  viewShiftTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
  },
  viewShiftText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },

  /* ── Empty state ─────────────────────────────────────────────────────────── */
  emptyContainer: {
    paddingTop: Spacing.xxxxl * 2,
    alignItems: 'center',
    paddingHorizontal: PAD,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
});
