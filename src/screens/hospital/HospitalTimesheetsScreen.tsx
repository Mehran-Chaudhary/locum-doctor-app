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
import { Colors, Typography, Spacing, Layout } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import type { Timesheet } from '../../types';
import type { TimesheetStatus } from '../../constants/enums';

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const TABS: FilterTab[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING_APPROVAL', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'DISPUTED', label: 'Disputed' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function HospitalTimesheetsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { hospitalTimesheets, hospitalTimesheetsLoading, loadHospitalTimesheets } = useTimesheetStore();

  const [activeTab, setActiveTab] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // ── Initial load ───────────────────────────────────────────────────────
  useEffect(() => {
    loadHospitalTimesheets();
  }, []);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      if (tab === 'ALL') {
        loadHospitalTimesheets();
      } else {
        loadHospitalTimesheets(tab as TimesheetStatus);
      }
    },
    [loadHospitalTimesheets],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'ALL') {
      await loadHospitalTimesheets();
    } else {
      await loadHospitalTimesheets(activeTab as TimesheetStatus);
    }
    setRefreshing(false);
  }, [activeTab, loadHospitalTimesheets]);

  // ── Navigate to detail ─────────────────────────────────────────────────
  const handleTimesheetPress = useCallback(
    (timesheet: Timesheet) => {
      navigation.navigate('HospitalTimesheetDetail', { timesheetId: timesheet.id, shiftId: timesheet.shiftId });
    },
    [navigation],
  );

  // ── Render ─────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: Timesheet }) => (
      <TimesheetCard
        timesheet={item}
        viewAs="hospital"
        onPress={() => handleTimesheetPress(item)}
      />
    ),
    [handleTimesheetPress],
  );

  const renderEmpty = useCallback(() => {
    if (hospitalTimesheetsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={56} color={Colors.textTertiary} />
        <Text style={[Typography.h4, { color: Colors.text, marginTop: Spacing.lg }]}>
          No timesheets yet
        </Text>
        <Text
          style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }]}
        >
          Timesheets appear here when you accept a doctor's application for your shifts.
        </Text>
      </View>
    );
  }, [hospitalTimesheetsLoading]);

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={[Typography.h3, { color: Colors.text }]}>Timesheets</Text>
      </View>

      {/* ── Filter tabs ─────────────────────────────────────────────────── */}
      <StatusFilterBar tabs={TABS} activeKey={activeTab} onChange={handleTabChange} />

      {/* ── List ─────────────────────────────────────────────────────────── */}
      {hospitalTimesheetsLoading && hospitalTimesheets.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.hospital} />
        </View>
      ) : (
        <FlatList
          data={hospitalTimesheets}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.hospital]}
              tintColor={Colors.hospital}
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
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl + 30,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxxxl,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: {
    paddingTop: Spacing.xxxxl * 2,
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
});
