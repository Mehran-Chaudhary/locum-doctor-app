import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAdminStore } from '../../stores/admin.store';
import UserListCard from '../../components/admin/UserListCard';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../constants/theme';
import { Role, AccountStatus } from '../../constants/enums';
import type { AdminUserListItem, AdminUsersParams } from '../../types';

const ROLE_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Doctors', value: Role.DOCTOR },
  { label: 'Hospitals', value: Role.HOSPITAL },
  { label: 'Admins', value: Role.SUPER_ADMIN },
] as const;

const STATUS_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Verified', value: AccountStatus.VERIFIED },
  { label: 'Pending', value: AccountStatus.PENDING_VERIFICATION },
  { label: 'Rejected', value: AccountStatus.REJECTED },
  { label: 'Suspended', value: AccountStatus.SUSPENDED },
] as const;

export default function AdminUsersScreen() {
  const { users, usersMeta, usersLoading, loadUsers, loadMoreUsers } = useAdminStore();
  const navigation = useNavigation<any>();

  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    const params: AdminUsersParams = {};
    if (roleFilter) params.role = roleFilter as any;
    if (statusFilter) params.status = statusFilter as any;
    loadUsers(params);
  }, [roleFilter, statusFilter]);

  const onRefresh = useCallback(() => {
    const params: AdminUsersParams = {};
    if (roleFilter) params.role = roleFilter as any;
    if (statusFilter) params.status = statusFilter as any;
    loadUsers(params);
  }, [loadUsers, roleFilter, statusFilter]);

  const handlePress = (user: AdminUserListItem) => {
    navigation.navigate('UserDetail', { userId: user.id });
  };

  const renderItem = ({ item }: { item: AdminUserListItem }) => (
    <UserListCard user={item} onPress={() => handlePress(item)} />
  );

  const renderEmpty = () => {
    if (usersLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No users found.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[Typography.h3, { color: Colors.text }]}>Users</Text>
        {usersMeta && (
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
            {usersMeta.total} total
          </Text>
        )}
      </View>

      {/* Role Filter */}
      <View style={styles.filterRow}>
        {ROLE_FILTERS.map((f) => {
          const isActive = roleFilter === f.value;
          return (
            <Text
              key={f.label}
              onPress={() => setRoleFilter(f.value)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              {f.label}
            </Text>
          );
        })}
      </View>

      {/* Status Filter */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => {
          const isActive = statusFilter === f.value;
          return (
            <Text
              key={f.label}
              onPress={() => setStatusFilter(f.value)}
              style={[styles.filterChipSmall, isActive && styles.filterChipSmallActive]}
            >
              {f.label}
            </Text>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        onEndReached={loadMoreUsers}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={usersLoading} onRefresh={onRefresh} tintColor={Colors.admin} />
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    ...Typography.bodySmallMedium,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    overflow: 'hidden',
  },
  filterChipActive: {
    backgroundColor: Colors.admin,
    color: Colors.textInverse,
  },
  filterChipSmall: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    overflow: 'hidden',
  },
  filterChipSmallActive: {
    backgroundColor: Colors.admin + '20',
    color: Colors.admin,
  },
  list: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.sm,
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
