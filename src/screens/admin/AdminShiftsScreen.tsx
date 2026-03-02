import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAdminStore } from '../../stores/admin.store';
import AdminShiftCard from '../../components/admin/AdminShiftCard';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../constants/theme';
import { ShiftStatus } from '../../constants/enums';
import type { AdminShiftListItem, AdminShiftsParams } from '../../types';

const STATUS_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Open', value: ShiftStatus.OPEN },
  { label: 'Filled', value: ShiftStatus.FILLED },
  { label: 'In Progress', value: ShiftStatus.IN_PROGRESS },
  { label: 'Completed', value: ShiftStatus.COMPLETED },
  { label: 'Expired', value: ShiftStatus.EXPIRED },
  { label: 'Cancelled', value: ShiftStatus.CANCELLED },
] as const;

export default function AdminShiftsScreen() {
  const { shifts, shiftsMeta, shiftsLoading, loadShifts, loadMoreShifts } = useAdminStore();

  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    const params: AdminShiftsParams = {};
    if (statusFilter) params.status = statusFilter as any;
    loadShifts(params);
  }, [statusFilter]);

  const onRefresh = useCallback(() => {
    const params: AdminShiftsParams = {};
    if (statusFilter) params.status = statusFilter as any;
    loadShifts(params);
  }, [loadShifts, statusFilter]);

  const renderItem = ({ item }: { item: AdminShiftListItem }) => (
    <AdminShiftCard shift={item} />
  );

  const renderEmpty = () => {
    if (shiftsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No shifts found.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[Typography.h3, { color: Colors.text }]}>All Shifts</Text>
        {shiftsMeta && (
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
            {shiftsMeta.total} total
          </Text>
        )}
      </View>

      {/* Status Filters (horizontal scroll) */}
      <FlatList
        horizontal
        data={STATUS_FILTERS as any}
        keyExtractor={(item: any) => item.label}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
        renderItem={({ item }: any) => {
          const isActive = statusFilter === item.value;
          return (
            <Text
              onPress={() => setStatusFilter(item.value)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              {item.label}
            </Text>
          );
        }}
      />

      {/* List */}
      <FlatList
        data={shifts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        onEndReached={loadMoreShifts}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={shiftsLoading} onRefresh={onRefresh} tintColor={Colors.admin} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  filterChip: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.admin,
    color: Colors.textInverse,
  },
  list: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.section,
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
