import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { useShiftStore } from '../../stores/shift.store';
import ShiftCard from '../../components/shifts/ShiftCard';
import StatusFilterBar, { FilterTab } from '../../components/shifts/StatusFilterBar';
import Button from '../../components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import { ShiftStatus } from '../../constants/enums';
import { getErrorMessage } from '../../utils/error';
import type { Shift } from '../../types';

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const TABS: FilterTab[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'FILLED', label: 'Filled' },
  { key: 'IN_PROGRESS', label: 'Active' },
  { key: 'COMPLETED', label: 'Done' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function MyShiftsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { hospitalShifts, hospitalShiftsLoading, loadHospitalShifts, cancelShift } = useShiftStore();

  const [activeTab, setActiveTab] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // ── Load ───────────────────────────────────────────────────────────────
  useEffect(() => {
    loadHospitalShifts();
  }, []);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      loadHospitalShifts(tab === 'ALL' ? undefined : (tab as any));
    },
    [loadHospitalShifts],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHospitalShifts(activeTab === 'ALL' ? undefined : (activeTab as any));
    setRefreshing(false);
  }, [activeTab, loadHospitalShifts]);

  // ── Cancel shift ───────────────────────────────────────────────────────
  const handleCancel = useCallback(
    (shift: Shift) => {
      Alert.alert(
        'Cancel Shift',
        `Are you sure you want to cancel "${shift.title}"? All pending applications will be rejected.`,
        [
          { text: 'Keep It', style: 'cancel' },
          {
            text: 'Cancel Shift',
            style: 'destructive',
            onPress: async () => {
              setCancellingId(shift.id);
              try {
                await cancelShift(shift.id);
                Toast.show({ type: 'success', text1: 'Cancelled', text2: 'Shift has been cancelled.' });
              } catch (err) {
                Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) });
              } finally {
                setCancellingId(null);
              }
            },
          },
        ],
      );
    },
    [cancelShift],
  );

  // ── Navigate ───────────────────────────────────────────────────────────
  const handleShiftPress = useCallback(
    (shift: Shift) => {
      if (shift.status === ShiftStatus.OPEN && (shift._count?.applications ?? 0) > 0) {
        navigation.navigate('ShiftApplicants', { shiftId: shift.id, shiftTitle: shift.title });
      } else {
        navigation.navigate('HospitalShiftDetail', { shiftId: shift.id });
      }
    },
    [navigation],
  );

  const handleCreateShift = useCallback(() => {
    navigation.navigate('CreateShift');
  }, [navigation]);

  // ── Render items ───────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: Shift }) => {
      const isOpen = item.status === ShiftStatus.OPEN;
      return (
        <View>
          <ShiftCard
            shift={item}
            onPress={() => handleShiftPress(item)}
            showApplicantCount
          />
          {isOpen && (
            <View style={styles.cardActions}>
              <Button
                label="Cancel Shift"
                onPress={() => handleCancel(item)}
                variant="outline"
                size="sm"
                loading={cancellingId === item.id}
                leftIcon="close-circle-outline"
              />
            </View>
          )}
        </View>
      );
    },
    [handleShiftPress, handleCancel, cancellingId],
  );

  const renderEmpty = useCallback(() => {
    if (hospitalShiftsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={56} color={Colors.textTertiary} />
        <Text style={[Typography.h4, { color: Colors.text, marginTop: Spacing.lg }]}>
          No shifts posted yet
        </Text>
        <Text
          style={[
            Typography.bodySmall,
            { color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
          ]}
        >
          Start by posting your first shift to find qualified locum doctors.
        </Text>
      </View>
    );
  }, [hospitalShiftsLoading]);

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={[Typography.h3, { color: Colors.text }]}>My Shifts</Text>
        <Button
          label="Post Shift"
          onPress={handleCreateShift}
          size="sm"
          leftIcon="add-circle-outline"
        />
      </View>

      {/* ── Filter tabs ─────────────────────────────────────────────────── */}
      <StatusFilterBar tabs={TABS} activeKey={activeTab} onChange={handleTabChange} />

      {/* ── List ─────────────────────────────────────────────────────────── */}
      {hospitalShiftsLoading && hospitalShifts.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={hospitalShifts}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl + 30,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxxxl,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    paddingRight: Spacing.xs,
  },
  emptyContainer: {
    paddingTop: Spacing.xxxxl * 2,
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
});
