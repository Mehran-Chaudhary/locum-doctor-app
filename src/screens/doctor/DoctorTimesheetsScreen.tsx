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

  // ── Render ─────────────────────────────────────────────────────────────
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
        <Ionicons name="time-outline" size={56} color={Colors.textTertiary} />
        <Text style={[Typography.h4, { color: Colors.text, marginTop: Spacing.lg }]}>
          No timesheets yet
        </Text>
        <Text
          style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }]}
        >
          Timesheets are created when your application is accepted by a hospital.
        </Text>
      </View>
    );
  }, [doctorTimesheetsLoading]);

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={[Typography.h3, { color: Colors.text }]}>My Timesheets</Text>
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
