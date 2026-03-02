import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useAdminStore } from '../../stores/admin.store';
import VerificationCard from '../../components/admin/VerificationCard';
import StatusFilterBar from '../../components/shifts/StatusFilterBar';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../constants/theme';
import { getErrorMessage } from '../../utils/error';
import type { AdminVerificationUser } from '../../types';

const ROLE_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Doctors', value: 'DOCTOR' },
  { label: 'Hospitals', value: 'HOSPITAL' },
] as const;

export default function AdminVerificationsScreen() {
  const {
    verifications,
    verificationsTotal,
    verificationsLoading,
    mutating,
    loadVerifications,
    verifyUser,
  } = useAdminStore();
  const navigation = useNavigation<any>();

  const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadVerifications(selectedRole as any);
  }, [selectedRole]);

  const onRefresh = useCallback(() => {
    loadVerifications(selectedRole as any);
  }, [loadVerifications, selectedRole]);

  const handleApprove = (user: AdminVerificationUser) => {
    Alert.alert(
      'Verify User',
      `Are you sure you want to verify "${user.email}"? They will get full access to the platform.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          style: 'default',
          onPress: async () => {
            try {
              await verifyUser(user.id, { status: 'VERIFIED', reason: 'Admin verified' });
              Toast.show({ type: 'success', text1: 'User Verified', text2: `${user.email} is now verified.` });
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(error) });
            }
          },
        },
      ],
    );
  };

  const handleReject = (user: AdminVerificationUser) => {
    Alert.alert(
      'Reject User',
      `Are you sure you want to reject "${user.email}"? They will not be able to use the platform.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await verifyUser(user.id, { status: 'REJECTED', reason: 'Admin rejected' });
              Toast.show({ type: 'success', text1: 'User Rejected', text2: `${user.email} has been rejected.` });
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(error) });
            }
          },
        },
      ],
    );
  };

  const handlePress = (user: AdminVerificationUser) => {
    navigation.navigate('UserDetail', { userId: user.id });
  };

  const renderItem = ({ item }: { item: AdminVerificationUser }) => (
    <VerificationCard
      user={item}
      onApprove={() => handleApprove(item)}
      onReject={() => handleReject(item)}
      onPress={() => handlePress(item)}
      disabled={mutating}
    />
  );

  const renderEmpty = () => {
    if (verificationsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-done-circle-outline" size={56} color={Colors.success} />
        <Text style={styles.emptyTitle}>All Caught Up!</Text>
        <Text style={styles.emptySubtitle}>
          No pending verifications at the moment.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[Typography.h3, { color: Colors.text }]}>Verifications</Text>
        <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
          {verificationsTotal} pending
        </Text>
      </View>

      {/* Role Filters */}
      <View style={styles.filterRow}>
        {ROLE_FILTERS.map((f) => {
          const isActive = selectedRole === f.value;
          return (
            <View key={f.label} style={[styles.filterChip, isActive && styles.filterChipActive]}>
              <Text
                onPress={() => setSelectedRole(f.value)}
                style={[styles.filterText, isActive && styles.filterTextActive]}
              >
                {f.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={verifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={verificationsLoading} onRefresh={onRefresh} tintColor={Colors.admin} />
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
    paddingBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  filterChipActive: {
    backgroundColor: Colors.admin,
  },
  filterText: {
    ...Typography.bodySmallMedium,
    color: Colors.textSecondary,
  },
  filterTextActive: {
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
  emptyTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
