import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { useReviewStore } from '../../stores/review.store';
import ReviewCard from '../../components/reviews/ReviewCard';
import StarRating from '../../components/reviews/StarRating';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import type { Review } from '../../types';

// ─── Route params ─────────────────────────────────────────────────────────────
type Params = {
  DoctorReviewsList: {
    doctorProfileId: string;
    doctorName: string;
    averageRating: number;
    totalReviews: number;
  };
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function DoctorReviewsListScreen() {
  const route = useRoute<RouteProp<Params, 'DoctorReviewsList'>>();
  const navigation = useNavigation();
  const { doctorProfileId, doctorName, averageRating, totalReviews } = route.params;

  const {
    doctorReviews,
    doctorReviewsMeta,
    doctorReviewsLoading,
    loadDoctorReviews,
    loadMoreDoctorReviews,
    clearDoctorReviews,
  } = useReviewStore();

  useEffect(() => {
    loadDoctorReviews(doctorProfileId);
    return () => clearDoctorReviews();
  }, [doctorProfileId]);

  const handleLoadMore = useCallback(() => {
    loadMoreDoctorReviews(doctorProfileId);
  }, [doctorProfileId, loadMoreDoctorReviews]);

  const renderItem = useCallback(({ item }: { item: Review }) => (
    <ReviewCard review={item} viewAs="doctor" />
  ), []);

  const ListHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.backRow}>
        <Ionicons name="arrow-back" size={24} color={Colors.text} onPress={() => navigation.goBack()} />
        <Text style={[Typography.h4, { color: Colors.text, marginLeft: Spacing.md }]}>Reviews</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={[Typography.bodySemiBold, { color: Colors.text }]}>{doctorName}</Text>
        <View style={styles.ratingRow}>
          <StarRating rating={Math.round(averageRating)} size={20} />
          <Text style={[Typography.h3, { color: Colors.text, marginLeft: Spacing.md }]}>
            {averageRating > 0 ? averageRating.toFixed(1) : 'New'}
          </Text>
        </View>
        <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: Spacing.xs }]}>
          {totalReviews} review{totalReviews !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  const ListEmpty = () =>
    !doctorReviewsLoading ? (
      <View style={styles.emptyCard}>
        <Ionicons name="chatbubble-outline" size={40} color={Colors.textTertiary} />
        <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: Spacing.md }]}>
          No reviews yet.
        </Text>
      </View>
    ) : null;

  const ListFooter = () =>
    doctorReviewsLoading && doctorReviews.length > 0 ? (
      <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.lg }} />
    ) : doctorReviewsMeta && doctorReviewsMeta.page < doctorReviewsMeta.totalPages ? null : (
      doctorReviews.length > 0 ? (
        <Text style={[Typography.caption, { color: Colors.textTertiary, textAlign: 'center', marginVertical: Spacing.lg }]}>
          Page {doctorReviewsMeta?.page ?? 1} of {doctorReviewsMeta?.totalPages ?? 1}
        </Text>
      ) : null
    );

  return (
    <View style={styles.screen}>
      <FlatList
        data={doctorReviews}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.list}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  list: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl + 30,
    paddingBottom: Spacing.xxxxl,
  },
  headerSection: {
    marginBottom: Spacing.xl,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xxxl,
    alignItems: 'center',
    ...Shadows.sm,
  },
});
