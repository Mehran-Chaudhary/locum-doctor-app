import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAdminStore } from '../../stores/admin.store';
import AdminReviewCard from '../../components/admin/AdminReviewCard';
import { Colors, Typography, Spacing, Layout } from '../../constants/theme';
import type { AdminReviewListItem } from '../../types';

export default function AdminReviewsScreen() {
  const { reviews, reviewsMeta, reviewsLoading, loadReviews, loadMoreReviews } = useAdminStore();

  useEffect(() => {
    loadReviews();
  }, []);

  const onRefresh = useCallback(() => {
    loadReviews();
  }, [loadReviews]);

  const renderItem = ({ item }: { item: AdminReviewListItem }) => (
    <AdminReviewCard review={item} />
  );

  const renderEmpty = () => {
    if (reviewsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="star-outline" size={56} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>No Reviews Yet</Text>
        <Text style={styles.emptySubtitle}>Reviews will appear here once submitted.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[Typography.h3, { color: Colors.text }]}>Reviews</Text>
        {reviewsMeta && (
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
            {reviewsMeta.total} total
          </Text>
        )}
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        onEndReached={loadMoreReviews}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={reviewsLoading} onRefresh={onRefresh} tintColor={Colors.admin} />
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
