import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAdminStore } from '../../stores/admin.store';
import DisputeCard from '../../components/admin/DisputeCard';
import { Colors, Typography, Spacing, Layout } from '../../constants/theme';
import type { AdminDispute } from '../../types';

export default function AdminDisputesScreen() {
  const { disputes, disputesLoading, loadDisputes } = useAdminStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadDisputes();
  }, []);

  const onRefresh = useCallback(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handlePress = (dispute: AdminDispute) => {
    navigation.navigate('DisputeResolve', { timesheetId: dispute.id });
  };

  const renderItem = ({ item }: { item: AdminDispute }) => (
    <DisputeCard dispute={item} onPress={() => handlePress(item)} />
  );

  const renderEmpty = () => {
    if (disputesLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-done-circle-outline" size={56} color={Colors.success} />
        <Text style={styles.emptyTitle}>No Disputed Timesheets</Text>
        <Text style={styles.emptySubtitle}>
          All timesheets are in good standing!
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[Typography.h3, { color: Colors.text }]}>Disputes</Text>
        <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
          {disputes.length} active
        </Text>
      </View>

      <FlatList
        data={disputes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={disputesLoading} onRefresh={onRefresh} tintColor={Colors.admin} />
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
