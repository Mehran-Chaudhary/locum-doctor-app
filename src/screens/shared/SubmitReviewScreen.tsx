import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { useReviewStore } from '../../stores/review.store';
import { useAuthStore } from '../../stores/auth.store';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import StarRating from '../../components/reviews/StarRating';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import { Role } from '../../constants/enums';
import { APP_CONFIG } from '../../constants/config';
import { formatDate } from '../../utils/date';
import { getErrorMessage } from '../../utils/error';

// ─── Route params ─────────────────────────────────────────────────────────────
type Params = {
  SubmitReview: {
    timesheetId: string;
    shiftTitle: string;
    entityName: string; // Hospital name or doctor name
    shiftDate?: string;
  };
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SubmitReviewScreen() {
  const route = useRoute<RouteProp<Params, 'SubmitReview'>>();
  const navigation = useNavigation();
  const { timesheetId, shiftTitle, entityName, shiftDate } = route.params;

  const user = useAuthStore((s) => s.user);
  const {
    myReview,
    myReviewLoading,
    myReviewChecked,
    submitting,
    checkMyReview,
    hospitalReviewDoctor,
    doctorReviewHospital,
  } = useReviewStore();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const isDoctor = user?.role === Role.DOCTOR;
  const isHospital = user?.role === Role.HOSPITAL;

  // Check if already reviewed on mount
  useEffect(() => {
    checkMyReview(timesheetId);
  }, [timesheetId]);

  // ── Submit Handler ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      Toast.show({ type: 'error', text1: 'Rating Required', text2: 'Please select at least 1 star.' });
      return;
    }

    try {
      const body = { rating, comment: comment.trim() || undefined };

      if (isHospital) {
        await hospitalReviewDoctor(timesheetId, body);
      } else {
        await doctorReviewHospital(timesheetId, body);
      }

      Toast.show({
        type: 'success',
        text1: 'Review Submitted!',
        text2: 'Your review will be visible once the other party also reviews (or after 7 days).',
      });
      navigation.goBack();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: getErrorMessage(err),
      });
    }
  }, [rating, comment, timesheetId, isHospital, hospitalReviewDoctor, doctorReviewHospital, navigation]);

  // ── Loading state while checking ───────────────────────────────────────
  if (myReviewLoading || !myReviewChecked) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // ── Already reviewed — show existing review ────────────────────────────
  if (myReview) {
    const revealDate = new Date(new Date(myReview.createdAt).getTime() + APP_CONFIG.BLIND_REVIEW_DAYS * 24 * 60 * 60 * 1000);
    const daysUntilVisible = Math.max(0, Math.ceil((revealDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.backRow}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} onPress={() => navigation.goBack()} />
            <Text style={[Typography.h4, { color: Colors.text, marginLeft: Spacing.md }]}>
              Your Review
            </Text>
          </View>

          <View style={styles.existingCard}>
            <View style={styles.existingCardHeader}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={[Typography.bodySemiBold, { color: Colors.success, marginLeft: Spacing.sm }]}>
                Review Submitted
              </Text>
            </View>

            <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: Spacing.md }]}>
              {shiftTitle}
            </Text>

            <View style={{ marginTop: Spacing.lg, alignItems: 'center' }}>
              <StarRating rating={myReview.rating} size={28} />
              <Text style={[Typography.h3, { color: Colors.text, marginTop: Spacing.sm }]}>
                {myReview.rating}/5
              </Text>
            </View>

            {myReview.comment && (
              <View style={styles.commentBox}>
                <Text style={[Typography.bodySmall, { color: Colors.textSecondary, fontStyle: 'italic' }]}>
                  "{myReview.comment}"
                </Text>
              </View>
            )}

            {/* Visibility status */}
            <View style={[styles.visibilityBox, { backgroundColor: myReview.isVisible ? Colors.successLight : Colors.warningLight }]}>
              <Ionicons
                name={myReview.isVisible ? 'eye' : 'eye-off'}
                size={16}
                color={myReview.isVisible ? Colors.success : Colors.warning}
              />
              <Text
                style={[
                  Typography.bodySmall,
                  {
                    color: myReview.isVisible ? Colors.success : Colors.warning,
                    marginLeft: Spacing.sm,
                    flex: 1,
                  },
                ]}
              >
                {myReview.isVisible
                  ? 'Your review is now visible to everyone.'
                  : daysUntilVisible > 0
                    ? `Waiting for the other party to review. Your review will become visible in ${daysUntilVisible} day${daysUntilVisible !== 1 ? 's' : ''}.`
                    : 'Your review will be visible once the other party also reviews.'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── New review form ────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <LoadingOverlay visible={submitting} message="Submitting review..." />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.backRow}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} onPress={() => navigation.goBack()} />
            <Text style={[Typography.h4, { color: Colors.text, marginLeft: Spacing.md }]}>
              Rate Your Experience
            </Text>
          </View>

          {/* Shift context */}
          <View style={styles.contextCard}>
            <Text style={[Typography.bodySemiBold, { color: Colors.text }]}>{shiftTitle}</Text>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>
              {entityName}{shiftDate ? ` • ${shiftDate}` : ''}
            </Text>
          </View>

          {/* Stars */}
          <View style={styles.ratingSection}>
            <Text style={[Typography.bodyMedium, { color: Colors.text, marginBottom: Spacing.lg, textAlign: 'center' }]}>
              How was your experience?
            </Text>
            <View style={{ alignItems: 'center' }}>
              <StarRating rating={rating} size={40} onRate={setRating} />
              {rating > 0 && (
                <Text style={[Typography.h3, { color: Colors.text, marginTop: Spacing.sm }]}>
                  {rating}/5
                </Text>
              )}
            </View>
          </View>

          {/* Comment */}
          <View style={styles.commentSection}>
            <Text style={[Typography.bodySmallMedium, { color: Colors.text, marginBottom: Spacing.sm }]}>
              Leave a comment (optional):
            </Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder={isDoctor
                ? 'Share your experience at this hospital...'
                : 'Share your experience with this doctor...'}
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={2000}
              textAlignVertical="top"
            />
            <Text style={[Typography.caption, { color: Colors.textTertiary, alignSelf: 'flex-end', marginTop: Spacing.xs }]}>
              {comment.length}/2000
            </Text>
          </View>

          {/* Blind review notice */}
          <View style={styles.noticeBox}>
            <Ionicons name="lock-closed" size={16} color={Colors.info} />
            <Text style={[Typography.bodySmall, { color: Colors.info, marginLeft: Spacing.sm, flex: 1 }]}>
              Your review will be hidden until the other party also leaves their review (or 7 days, whichever comes first).
            </Text>
          </View>

          {/* Submit */}
          <Button
            label="SUBMIT REVIEW"
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon="send"
            loading={submitting}
            disabled={rating === 0}
            style={{ marginTop: Spacing.xxl }}
          />

          <View style={{ height: Spacing.xxxxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl + 30,
    paddingBottom: Spacing.xxxxl,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  contextCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    ...Shadows.sm,
  },
  ratingSection: {
    marginBottom: Spacing.xxl,
  },
  commentSection: {
    marginBottom: Spacing.lg,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    minHeight: 120,
    maxHeight: 200,
    ...Typography.bodySmall,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
  },
  existingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.sm,
  },
  existingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentBox: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  visibilityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
});
