import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import type { AdminReviewListItem } from '../../types';
import { formatRelative } from '../../utils/date';

interface AdminReviewCardProps {
  review: AdminReviewListItem;
  style?: ViewStyle;
}

export default function AdminReviewCard({ review, style }: AdminReviewCardProps) {
  const isHospitalReviewing = review.reviewerType === 'HOSPITAL_REVIEWING_DOCTOR';

  const reviewerLabel = isHospitalReviewing
    ? review.timesheet.hospitalProfile.hospitalName
    : `Dr. ${review.timesheet.doctorProfile.firstName} ${review.timesheet.doctorProfile.lastName}`;

  const revieweeLabel = isHospitalReviewing
    ? `Dr. ${review.timesheet.doctorProfile.firstName} ${review.timesheet.doctorProfile.lastName}`
    : review.timesheet.hospitalProfile.hospitalName;

  return (
    <View style={[styles.card, style]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= review.rating ? 'star' : 'star-outline'}
              size={16}
              color={star <= review.rating ? Colors.warning : Colors.textTertiary}
            />
          ))}
        </View>
        <View style={[styles.visibilityBadge, {
          backgroundColor: review.isVisible ? Colors.successLight : Colors.warningLight,
        }]}>
          <Ionicons
            name={review.isVisible ? 'eye-outline' : 'eye-off-outline'}
            size={12}
            color={review.isVisible ? Colors.success : Colors.warning}
          />
          <Text style={[Typography.captionMedium, {
            color: review.isVisible ? Colors.success : Colors.warning,
            marginLeft: 4,
          }]}>
            {review.isVisible ? 'Visible' : 'Hidden'}
          </Text>
        </View>
      </View>

      {/* Reviewer → Reviewee */}
      <View style={styles.directionRow}>
        <View style={styles.personBadge}>
          <Ionicons
            name={isHospitalReviewing ? 'business' : 'person'}
            size={12}
            color={isHospitalReviewing ? Colors.secondary : Colors.primary}
          />
          <Text style={styles.personText} numberOfLines={1}>{reviewerLabel}</Text>
        </View>
        <Ionicons name="arrow-forward" size={14} color={Colors.textTertiary} style={{ marginHorizontal: 4 }} />
        <View style={styles.personBadge}>
          <Ionicons
            name={isHospitalReviewing ? 'person' : 'business'}
            size={12}
            color={isHospitalReviewing ? Colors.primary : Colors.secondary}
          />
          <Text style={styles.personText} numberOfLines={1}>{revieweeLabel}</Text>
        </View>
      </View>

      {/* Shift Title */}
      <View style={styles.shiftRow}>
        <Ionicons name="briefcase-outline" size={14} color={Colors.textTertiary} />
        <Text style={styles.shiftText} numberOfLines={1}>{review.timesheet.shift.title}</Text>
      </View>

      {/* Comment */}
      {review.comment && (
        <Text style={styles.comment} numberOfLines={3}>"{review.comment}"</Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.typePill, {
          backgroundColor: isHospitalReviewing ? Colors.secondaryLight : Colors.primaryLight,
        }]}>
          <Text style={[Typography.captionMedium, {
            color: isHospitalReviewing ? Colors.secondary : Colors.primary,
          }]}>
            {isHospitalReviewing ? 'Hospital → Doctor' : 'Doctor → Hospital'}
          </Text>
        </View>
        <Text style={styles.timeText}>{formatRelative(review.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  directionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  personBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    maxWidth: '42%',
  },
  personText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 4,
    flexShrink: 1,
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  shiftText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  comment: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  typePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  timeText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});
