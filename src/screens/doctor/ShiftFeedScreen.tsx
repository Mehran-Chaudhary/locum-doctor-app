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
import { Colors, Spacing } from '../../constants/theme';
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
        <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>No shifts found</Text>
        <Text style={styles.emptySubtitle}>
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
          <Ionicons name="hourglass-outline" size={16} color={Colors.statusPending} />
          <Text style={styles.pendingText}>
            PMDC verification is pending. You can browse but cannot apply yet.
          </Text>
        </View>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, isPending && { paddingTop: Spacing.md }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Available Shifts</Text>
          {feedMeta && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{feedMeta.total}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setFilterVisible(!filterVisible)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={filterVisible ? 'close' : 'options-outline'}
            size={18}
            color={hasActiveFilters ? '#FFF' : Colors.text}
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
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters} activeOpacity={0.7}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters} activeOpacity={0.7}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Sort chip ───────────────────────────────────────────────────── */}
      <View style={styles.sortRow}>
        <View style={styles.sortChip}>
          <Ionicons name="swap-vertical" size={12} color={Colors.primary} />
          <Text style={styles.sortLabel}>
            {SORT_OPTIONS.find((s) => s.value === feedParams.sortBy)?.label ?? 'Starting Soonest'}
          </Text>
        </View>
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
const SIDE_PAD = 14;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* ── Pending banner ──────────────────────────────────────────────────────── */
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: SIDE_PAD,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xxl + 30,
  },
  pendingText: {
    fontSize: 12,
    color: Colors.statusPending,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 16,
  },

  /* ── Header ──────────────────────────────────────────────────────────────── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIDE_PAD,
    paddingTop: Spacing.xxl + 30,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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

  /* ── Filter button ───────────────────────────────────────────────────────── */
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
  },

  /* ── Filter panel ────────────────────────────────────────────────────────── */
  filterPanel: {
    backgroundColor: Colors.surface,
    paddingHorizontal: SIDE_PAD,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },

  /* ── Sort row ────────────────────────────────────────────────────────────── */
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIDE_PAD,
    paddingBottom: Spacing.sm,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  sortLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },

  /* ── List ─────────────────────────────────────────────────────────────────── */
  listContent: {
    paddingHorizontal: SIDE_PAD,
    paddingBottom: Spacing.xxxxl,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },

  /* ── Empty state ─────────────────────────────────────────────────────────── */
  emptyContainer: {
    paddingTop: Spacing.xxxxl * 2,
    alignItems: 'center',
    paddingHorizontal: SIDE_PAD,
  },
  emptyTitle: {
    fontSize: 18,
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

  /* ── Centered loader ─────────────────────────────────────────────────────── */
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
