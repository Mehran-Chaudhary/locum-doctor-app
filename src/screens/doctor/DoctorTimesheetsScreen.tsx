import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTimesheetStore } from '../../stores/timesheet.store';
import TimesheetCard from '../../components/timesheets/TimesheetCard';
import StatusFilterBar, { FilterTab } from '../../components/shifts/StatusFilterBar';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import type { Timesheet } from '../../types';
import type { TimesheetStatus } from '../../constants/enums';

const PAD = 14;

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const TABS: FilterTab[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING_APPROVAL', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'DISPUTED', label: 'Disputed' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function DoctorTimesheetsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { doctorTimesheets, doctorTimesheetsLoading, loadDoctorTimesheets } = useTimesheetStore();

  const [activeTab, setActiveTab] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // ── Initial load ───────────────────────────────────────────────────────
  useEffect(() => {
    loadDoctorTimesheets();
  }, []);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      if (tab === 'ALL') {
        loadDoctorTimesheets();
      } else {
        loadDoctorTimesheets(tab as TimesheetStatus);
      }
    },
    [loadDoctorTimesheets],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'ALL') {
      await loadDoctorTimesheets();
    } else {
      await loadDoctorTimesheets(activeTab as TimesheetStatus);
    }
    setRefreshing(false);
  }, [activeTab, loadDoctorTimesheets]);

  // ── Navigate to detail ─────────────────────────────────────────────────
  const handleTimesheetPress = useCallback(
    (timesheet: Timesheet) => {
      navigation.navigate('TimesheetDetail', { shiftId: timesheet.shiftId });
    },
    [navigation],
  );

  // ── Render helpers ─────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: Timesheet }) => (
      <TimesheetCard
        timesheet={item}
        viewAs="doctor"
        onPress={() => handleTimesheetPress(item)}
      />
    ),
    [handleTimesheetPress],
  );

  const renderEmpty = useCallback(() => {
    if (doctorTimesheetsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={48} color={Colors.borderLight} />
        <Text style={styles.emptyTitle}>No timesheets yet</Text>
        <Text style={styles.emptyBody}>
          Timesheets are created when your application is accepted by a hospital.
        </Text>
      </View>
    );
  }, [doctorTimesheetsLoading]);

  const count = doctorTimesheets.length;

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Timesheets</Text>
        {count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>

      {/* ── Filter tabs ─────────────────────────────────────────────────── */}
      <StatusFilterBar tabs={TABS} activeKey={activeTab} onChange={handleTabChange} />

      {/* ── List ─────────────────────────────────────────────────────────── */}
      {doctorTimesheetsLoading && doctorTimesheets.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={doctorTimesheets}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingTop: 54,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  countBadge: {
    marginLeft: 8,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: PAD,
    paddingBottom: 100,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: {
    paddingTop: 120,
    alignItems: 'center',
    paddingHorizontal: PAD,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 14,
  },
  emptyBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
});
