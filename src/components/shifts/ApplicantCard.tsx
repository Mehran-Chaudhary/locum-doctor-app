import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { SPECIALTY_OPTIONS, ApplicationStatus } from '../../constants/enums';
import { formatPKR } from '../../utils/date';
import type { ShiftApplication } from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────
interface ApplicantCardProps {
  application: ShiftApplication;
  onAccept?: () => void;
  /** Whether the accept action is running. */
  accepting?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ApplicantCard({ application, onAccept, accepting }: ApplicantCardProps) {
  const doc = application.doctorProfile;
  if (!doc) return null;

  const specialtyLabel = SPECIALTY_OPTIONS.find((o) => o.value === doc.specialty)?.label ?? doc.specialty;
  const canAccept = application.status === ApplicationStatus.APPLIED;

  return (
    <View style={styles.card}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {doc.profilePicUrl ? (
          <Image source={{ uri: doc.profilePicUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={22} color={Colors.textTertiary} />
          </View>
        )}

        <View style={styles.nameSection}>
          <Text style={[Typography.bodySmallSemiBold, { color: Colors.text }]} numberOfLines={1}>
            Dr. {doc.firstName} {doc.lastName}
          </Text>
          <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
            {specialtyLabel} · PMDC: {doc.pmdcNumber}
          </Text>
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: appStatusBg(application.status) }]}>
          <Text style={[Typography.captionMedium, { color: appStatusColor(application.status) }]}>
            {application.status}
          </Text>
        </View>
      </View>

      {/* ── Details row ───────────────────────────────────────────────────── */}
      <View style={styles.detailsRow}>
        <DetailChip icon="time-outline" label={`${doc.yearsExperience} yrs`} />
        <DetailChip icon="cash-outline" label={`${formatPKR(doc.hourlyRate)}/hr`} />
        <DetailChip icon="location-outline" label={doc.city} />
      </View>

      {/* ── Rating ────────────────────────────────────────────────────────── */}
      <View style={styles.ratingRow}>
        <Ionicons name="star" size={14} color={Colors.warning} />
        <Text style={[Typography.bodySmallMedium, { color: Colors.text, marginLeft: 4 }]}>
          {doc.averageRating ? doc.averageRating.toFixed(1) : 'New'}
        </Text>
        <Text style={[Typography.caption, { color: Colors.textTertiary, marginLeft: 4 }]}>
          ({doc.totalReviews} reviews)
        </Text>
      </View>

      {/* ── Bio snippet ───────────────────────────────────────────────────── */}
      {doc.bio ? (
        <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.sm }]} numberOfLines={2}>
          {doc.bio}
        </Text>
      ) : null}

      {/* ── Accept button ─────────────────────────────────────────────────── */}
      {canAccept && onAccept && (
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={onAccept}
          disabled={accepting}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle" size={18} color={Colors.textInverse} />
          <Text style={[Typography.buttonSmall, { color: Colors.textInverse, marginLeft: 6 }]}>
            {accepting ? 'Accepting...' : 'Accept'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Detail chip ──────────────────────────────────────────────────────────────
function DetailChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.detailChip}>
      <Ionicons name={icon} size={12} color={Colors.textTertiary} />
      <Text style={[Typography.caption, { color: Colors.textSecondary, marginLeft: 4 }]}>{label}</Text>
    </View>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function appStatusBg(status: string): string {
  switch (status) {
    case 'APPLIED': return Colors.warningLight;
    case 'ACCEPTED': return Colors.successLight;
    case 'REJECTED': return Colors.surfaceSecondary;
    case 'WITHDRAWN': return Colors.surfaceSecondary;
    default: return Colors.surfaceSecondary;
  }
}

function appStatusColor(status: string): string {
  switch (status) {
    case 'APPLIED': return Colors.warning;
    case 'ACCEPTED': return Colors.success;
    case 'REJECTED': return Colors.textTertiary;
    case 'WITHDRAWN': return Colors.textTertiary;
    default: return Colors.textSecondary;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSecondary,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSection: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    marginLeft: Spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    marginTop: Spacing.lg,
  },
});
