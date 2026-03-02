import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useShiftStore } from '../../stores/shift.store';
import { useAuthStore } from '../../stores/auth.store';
import ShiftCard from '../../components/shifts/ShiftCard';
import PickerModal from '../../components/ui/PickerModal';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import { SPECIALTY_OPTIONS, AccountStatus } from '../../constants/enums';
import type { Shift, ShiftFeedParams } from '../../types';

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'starting_soonest', label: 'Starting Soonest' },
  { value: 'highest_pay', label: 'Highest Pay' },
  { value: 'distance', label: 'Nearest First' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ShiftFeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuthStore();

  const {
    feed,
    feedLoading,
    feedRefreshing,
    feedMeta,
    feedParams,
    loadFeed,
    loadMoreFeed,
    refreshFeed,
    setFeedParams,
  } = useShiftStore();

  // ── Local filter state (before apply) ───────────────────────────────────
  const [filterVisible, setFilterVisible] = useState(false);
  const [localCity, setLocalCity] = useState(feedParams.city ?? '');
  const [localSpecialty, setLocalSpecialty] = useState(feedParams.specialty ?? '');
  const [localSort, setLocalSort] = useState<string>(feedParams.sortBy ?? 'starting_soonest');

  // ── Auth state ──────────────────────────────────────────────────────
  const isGuest = !user;
  const isPending = user?.status === AccountStatus.PENDING_VERIFICATION;

  // ── Initial load ───────────────────────────────────────────────────────
  // Always attempt — for guests the API 401 is caught silently by the store;
  // for auth users the feed loads normally.
  useEffect(() => {
    loadFeed();
  }, []);

  // ── Apply filters ──────────────────────────────────────────────────────
  const applyFilters = useCallback(() => {
    const params: ShiftFeedParams = {
      sortBy: localSort as ShiftFeedParams['sortBy'],
    };
    if (localCity.trim()) params.city = localCity.trim();
    if (localSpecialty) params.specialty = localSpecialty as any;
    loadFeed(params);
    setFilterVisible(false);
  }, [localCity, localSpecialty, localSort, loadFeed]);

  const clearFilters = useCallback(() => {
    setLocalCity('');
    setLocalSpecialty('');
    setLocalSort('starting_soonest');
    loadFeed({ sortBy: 'starting_soonest' });
    setFilterVisible(false);
  }, [loadFeed]);

  const hasActiveFilters = !!(feedParams.city || feedParams.specialty);

  // ── Pagination ─────────────────────────────────────────────────────────
  const handleEndReached = useCallback(() => {
    if (!feedLoading && feedMeta && feedMeta.page < feedMeta.totalPages) {
      loadMoreFeed();
    }
  }, [feedLoading, feedMeta, loadMoreFeed]);

  // ── Navigate to detail ─────────────────────────────────────────────────
  const handleShiftPress = useCallback(
    (shift: Shift) => {
      navigation.navigate('ShiftDetail', { shiftId: shift.id });
    },
    [navigation],
  );

  // ── Renders ────────────────────────────────────────────────────────────
  const renderShift = useCallback(
    ({ item }: { item: Shift }) => (
      <ShiftCard shift={item} onPress={() => handleShiftPress(item)} />
    ),
    [handleShiftPress],
  );

  const renderFooter = useCallback(() => {
    if (!feedLoading || feed.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }, [feedLoading, feed.length]);

  const renderEmpty = useCallback(() => {
    if (feedLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={56} color={Colors.textTertiary} />
        <Text style={[Typography.h4, { color: Colors.text, marginTop: Spacing.lg }]}>
          No shifts found
        </Text>
        <Text
          style={[
            Typography.bodySmall,
            { color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
          ]}
        >
          {isGuest
            ? 'Sign in for personalized shifts with distance info, or check back later.'
            : 'Try adjusting your filters or check back later.'}
        </Text>
      </View>
    );
  }, [feedLoading, isGuest]);

  return (
    <View style={styles.screen}>
      {/* ── Pending verification banner ─────────────────────────────────── */}
      {isPending && (
        <View style={styles.pendingBanner}>
          <Ionicons name="hourglass-outline" size={18} color={Colors.statusPending} />
          <Text style={[Typography.bodySmall, { color: Colors.statusPending, marginLeft: Spacing.sm, flex: 1 }]}>
            PMDC verification is pending. You can browse but cannot apply for shifts yet.
          </Text>
        </View>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, isPending && { paddingTop: Spacing.md }]}>
        <View>
          <Text style={[Typography.h3, { color: Colors.text }]}>Available Shifts</Text>
          {feedMeta && (
            <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: 2 }]}>
              {feedMeta.total} shift{feedMeta.total !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setFilterVisible(!filterVisible)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={hasActiveFilters ? Colors.textInverse : Colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* ── Filter panel ────────────────────────────────────────────────── */}
      {filterVisible && (
        <View style={styles.filterPanel}>
          <PickerModal
            label="Specialty"
            options={[{ value: '', label: 'All Specialties' }, ...SPECIALTY_OPTIONS]}
            selectedValue={localSpecialty}
            onSelect={setLocalSpecialty}
            leftIcon="medkit-outline"
            placeholder="All Specialties"
          />

          <PickerModal
            label="Sort By"
            options={SORT_OPTIONS}
            selectedValue={localSort}
            onSelect={setLocalSort}
            leftIcon="swap-vertical-outline"
            searchable={false}
          />

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={[Typography.buttonSmall, { color: Colors.textSecondary }]}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={[Typography.buttonSmall, { color: Colors.textInverse }]}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Sort indicator ──────────────────────────────────────────────── */}
      <View style={styles.sortRow}>
        <Ionicons name="swap-vertical" size={14} color={Colors.textTertiary} />
        <Text style={[Typography.caption, { color: Colors.textTertiary, marginLeft: 4 }]}>
          {SORT_OPTIONS.find((s) => s.value === feedParams.sortBy)?.label ?? 'Starting Soonest'}
        </Text>
      </View>

      {/* ── Feed list ───────────────────────────────────────────────────── */}
      {feedLoading && feed.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          renderItem={renderShift}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={feedRefreshing}
              onRefresh={() => refreshFeed(isGuest)}
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
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl + 30, // accounting for safe area
    paddingBottom: Spacing.md,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
  },
  filterPanel: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxxxl,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: Spacing.xxxxl * 2,
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xxl + 30,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
