import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
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
      {/* Left accent strip */}
      <View style={[styles.accent, { backgroundColor: appStatusAccent(application.status) }]} />

      <View style={styles.content}>
        {/* ── Row 1: Avatar + Name + Status ───────────────────────────────── */}
        <View style={styles.topRow}>
          {doc.profilePicUrl ? (
            <Image source={{ uri: doc.profilePicUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={16} color={Colors.textTertiary} />
            </View>
          )}

          <View style={styles.nameCol}>
            <Text style={styles.name} numberOfLines={1}>
              Dr. {doc.firstName} {doc.lastName}
            </Text>
            <Text style={styles.specialty}>{specialtyLabel}</Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: appStatusBg(application.status) }]}>
            <Text style={[styles.statusText, { color: appStatusColor(application.status) }]}>
              {application.status}
            </Text>
          </View>
        </View>

        {/* ── Row 2: Detail chips ─────────────────────────────────────────── */}
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Ionicons name="time-outline" size={10} color={Colors.textTertiary} />
            <Text style={styles.chipLabel}>{doc.yearsExperience} yrs</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="cash-outline" size={10} color={Colors.textTertiary} />
            <Text style={styles.chipLabel}>{formatPKR(doc.hourlyRate)}/hr</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="location-outline" size={10} color={Colors.textTertiary} />
            <Text style={styles.chipLabel}>{doc.city}</Text>
          </View>
          <View style={styles.ratingChip}>
            <Ionicons name="star" size={10} color={Colors.warning} />
            <Text style={styles.ratingLabel}>
              {doc.averageRating ? doc.averageRating.toFixed(1) : 'New'}
            </Text>
            <Text style={styles.reviewCount}>({doc.totalReviews})</Text>
          </View>
        </View>

        {/* ── Bio snippet ─────────────────────────────────────────────────── */}
        {doc.bio ? (
          <Text style={styles.bio} numberOfLines={2}>{doc.bio}</Text>
        ) : null}

        {/* ── Accept button ───────────────────────────────────────────────── */}
        {canAccept && onAccept && (
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={onAccept}
            disabled={accepting}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={14} color="#FFF" />
            <Text style={styles.acceptText}>
              {accepting ? 'Accepting...' : 'Accept'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function appStatusBg(status: string): string {
  switch (status) {
    case 'APPLIED':   return Colors.warningLight;
    case 'ACCEPTED':  return Colors.successLight;
    case 'REJECTED':  return Colors.surfaceSecondary;
    case 'WITHDRAWN': return Colors.surfaceSecondary;
    default:          return Colors.surfaceSecondary;
  }
}

function appStatusColor(status: string): string {
  switch (status) {
    case 'APPLIED':   return Colors.warning;
    case 'ACCEPTED':  return Colors.success;
    case 'REJECTED':  return Colors.textTertiary;
    case 'WITHDRAWN': return Colors.textTertiary;
    default:          return Colors.textSecondary;
  }
}

function appStatusAccent(status: string): string {
  switch (status) {
    case 'APPLIED':   return Colors.warning;
    case 'ACCEPTED':  return Colors.success;
    case 'REJECTED':  return Colors.textTertiary;
    case 'WITHDRAWN': return Colors.disabled;
    default:          return Colors.border;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  /* ── Card shell ──────────────────────────────────────────────────────────── */
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  /* ── Top row: avatar + name + status ─────────────────────────────────────── */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  specialty: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* ── Detail chips ────────────────────────────────────────────────────────── */
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  chipLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 10,
    color: Colors.textTertiary,
  },

  /* ── Bio ──────────────────────────────────────────────────────────────────── */
  bio: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 6,
  },

  /* ── Accept button ───────────────────────────────────────────────────────── */
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
    gap: 5,
  },
  acceptText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
});
