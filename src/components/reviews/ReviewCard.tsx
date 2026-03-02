import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StarRating from './StarRating';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { DEPARTMENT_OPTIONS, SPECIALTY_OPTIONS } from '../../constants/enums';
import { formatDate } from '../../utils/date';
import type { Review } from '../../types';

interface ReviewCardProps {
  review: Review;
  /** 'doctor' = showing reviews about a doctor (reviewer is hospital),
   *  'hospital' = showing reviews about a hospital (reviewer is doctor). */
  viewAs: 'doctor' | 'hospital';
  style?: object;
}

export default function ReviewCard({ review, viewAs, style }: ReviewCardProps) {
  const shift = review.timesheet?.shift;
  const departmentLabel = shift?.department
    ? (DEPARTMENT_OPTIONS.find((d) => d.value === shift.department)?.label ?? shift.department)
    : '';

  // For doctor reviews view: show hospital info (who wrote the review)
  // For hospital reviews view: show doctor info (who wrote the review)
  const isHospitalReviewer = viewAs === 'doctor';

  const hospitalName = shift?.hospitalProfile?.hospitalName;
  const hospitalLogo = shift?.hospitalProfile?.logoUrl;

  const doctorProfile = review.timesheet?.doctorProfile;
  const doctorName = doctorProfile
    ? `Dr. ${doctorProfile.firstName} ${doctorProfile.lastName}`
    : null;
  const doctorPic = doctorProfile?.profilePicUrl;
  const specialtyLabel = doctorProfile?.specialty
    ? (SPECIALTY_OPTIONS.find((s) => s.value === doctorProfile.specialty)?.label ?? doctorProfile.specialty)
    : '';

  return (
    <View style={[styles.card, style]}>
      {/* Header: rating + date */}
      <View style={styles.header}>
        <StarRating rating={review.rating} size={16} />
        <Text style={[Typography.caption, { color: Colors.textTertiary, marginLeft: Spacing.sm }]}>
          {formatDate(review.createdAt)}
        </Text>
      </View>

      {/* Reviewer info */}
      <View style={styles.reviewerRow}>
        {isHospitalReviewer ? (
          <>
            {hospitalLogo ? (
              <Image source={{ uri: hospitalLogo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="business" size={14} color={Colors.textTertiary} />
              </View>
            )}
            <View style={styles.reviewerInfo}>
              <Text style={[Typography.bodySmallMedium, { color: Colors.text }]}>
                {hospitalName ?? 'Hospital'}
              </Text>
              {shift?.title && (
                <Text style={[Typography.caption, { color: Colors.textTertiary }]}>
                  {shift.title}{departmentLabel ? ` • ${departmentLabel}` : ''}
                </Text>
              )}
            </View>
          </>
        ) : (
          <>
            {doctorPic ? (
              <Image source={{ uri: doctorPic }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={14} color={Colors.textTertiary} />
              </View>
            )}
            <View style={styles.reviewerInfo}>
              <Text style={[Typography.bodySmallMedium, { color: Colors.text }]}>
                {doctorName ?? 'Doctor'}
              </Text>
              {(shift?.title || specialtyLabel) && (
                <Text style={[Typography.caption, { color: Colors.textTertiary }]}>
                  {shift?.title ?? ''}{specialtyLabel ? ` • ${specialtyLabel}` : ''}
                </Text>
              )}
            </View>
          </>
        )}
      </View>

      {/* Comment */}
      {review.comment ? (
        <Text style={[Typography.bodySmall, styles.comment]}>{review.comment}</Text>
      ) : null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  reviewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  comment: {
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
});
