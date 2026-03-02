import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuthStore } from '../../stores/auth.store';
import { SPECIALTY_OPTIONS } from '../../constants/enums';
import { Colors } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const AVATAR_SIZE = 96;
const PAD = 16;

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DoctorProfileViewScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const p = user?.doctorProfile;

  if (!p) return null;

  const specialtyLabel = SPECIALTY_OPTIONS.find((o) => o.value === p.specialty)?.label ?? p.specialty;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ═══════════════════ Gradient Header ═══════════════════════════ */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative blobs */}
          <View style={styles.decoBlob1} />
          <View style={styles.decoBlob2} />

          {/* Top row: settings + edit */}
          <View style={styles.headerTopRow}>
            <Text style={styles.headerLabel}>My Profile</Text>
            <TouchableOpacity
              style={styles.editBtn}
              activeOpacity={0.7}
              onPress={() => navigation?.navigate?.('EditDoctorProfile')}
            >
              <Ionicons name="create-outline" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

        </LinearGradient>

        {/* ═══════════════════ Avatar ════════════════════════════════════ */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {p.profilePicUrl ? (
              <Image source={{ uri: p.profilePicUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person" size={36} color={Colors.textTertiary} />
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>
        </View>

        {/* ═══════════════════ Name & Specialty ═══════════════════════════ */}
        <View style={styles.nameSection}>
          <Text style={styles.doctorName}>Dr. {p.firstName} {p.lastName}</Text>
          <Text style={styles.specialty}>{specialtyLabel}</Text>

          {/* Verification badge */}
          <View style={[styles.verifyBadge, {
            backgroundColor: user?.status === 'VERIFIED' ? Colors.successLight : Colors.warningLight,
          }]}>
            <Ionicons
              name={user?.status === 'VERIFIED' ? 'checkmark-circle' : 'time-outline'}
              size={12}
              color={user?.status === 'VERIFIED' ? Colors.success : Colors.warning}
            />
            <Text style={[styles.verifyText, {
              color: user?.status === 'VERIFIED' ? Colors.success : Colors.warning,
            }]}>
              {user?.status?.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* ═══════════════════ Stats strip ════════════════════════════════ */}
        <View style={styles.statsStrip}>
          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.7}
            onPress={() => navigation?.navigate?.('DoctorReviewsList', {
              doctorProfileId: p.id,
              doctorName: `Dr. ${p.firstName} ${p.lastName}`,
              averageRating: p.averageRating,
              totalReviews: p.totalReviews,
            })}
          >
            <View style={styles.statIconWrap}>
              <Ionicons name="star" size={16} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>{p.averageRating ? p.averageRating.toFixed(1) : '—'}</Text>
            <Text style={styles.statLabel}>{p.totalReviews} reviews</Text>
            <Ionicons name="chevron-forward" size={12} color={Colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="time-outline" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{p.yearsExperience}</Text>
            <Text style={styles.statLabel}>Yrs exp.</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: Colors.secondaryLight }]}>
              <Ionicons name="cash-outline" size={16} color={Colors.secondary} />
            </View>
            <Text style={styles.statValue}>Rs. {Number(p.hourlyRate).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Per hour</Text>
          </View>
        </View>

        {/* ═══════════════════ Info grid ══════════════════════════════════ */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardHeader}>Details</Text>

          <View style={styles.infoGrid}>
            <InfoCell icon="location-outline" label="City" value={p.city ?? '—'} />
            <InfoCell icon="id-card-outline" label="PMDC #" value={p.pmdcNumber ?? '—'} />
            <InfoCell icon="medical-outline" label="Specialty" value={specialtyLabel} />
            <InfoCell
              icon="time-outline"
              label="Experience"
              value={`${p.yearsExperience} year${p.yearsExperience !== 1 ? 's' : ''}`}
            />
          </View>

          {/* Bio */}
          {p.bio ? (
            <View style={styles.bioBlock}>
              <View style={styles.bioAccent} />
              <View style={styles.bioContent}>
                <Text style={styles.bioLabel}>About</Text>
                <Text style={styles.bioText}>{p.bio}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* ═══════════════════ PMDC Certificate preview ══════════════════ */}
        {p.pmdcCertUrl && (
          <View style={styles.certCard}>
            <View style={styles.certHeader}>
              <Ionicons name="document-text-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.certHeaderText}>PMDC Certificate</Text>
            </View>
            <Image source={{ uri: p.pmdcCertUrl }} style={styles.certImage} resizeMode="cover" />
          </View>
        )}

        {/* ═══════════════════ Actions ════════════════════════════════════ */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.6}
            onPress={() => navigation?.navigate?.('EditDoctorProfile')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="create-outline" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.6}
            onPress={() => navigation?.navigate?.('DoctorReviewsList', {
              doctorProfileId: p.id,
              doctorName: `Dr. ${p.firstName} ${p.lastName}`,
              averageRating: p.averageRating,
              totalReviews: p.totalReviews,
            })}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.warningLight }]}>
              <Ionicons name="star-outline" size={16} color={Colors.warning} />
            </View>
            <Text style={styles.actionLabel}>My Reviews</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, styles.actionRowLast]}
            activeOpacity={0.6}
            onPress={logout}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.errorLight }]}>
              <Ionicons name="log-out-outline" size={16} color={Colors.error} />
            </View>
            <Text style={[styles.actionLabel, { color: Colors.error }]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Info cell helper ─────────────────────────────────────────────────────────
function InfoCell({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={cellStyles.cell}>
      <Ionicons name={icon} size={14} color={Colors.textTertiary} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={cellStyles.label}>{label}</Text>
        <Text style={cellStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const cellStyles = StyleSheet.create({
  cell: {
    flexDirection: 'row',
    width: '48%',
    paddingVertical: 10,
  },
  label: { fontSize: 10, fontWeight: '500', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 },
  value: { fontSize: 13, fontWeight: '600', color: Colors.text, marginTop: 2 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 30 },

  /* ── Gradient header ─────────────────────────────────────────────────────── */
  headerGradient: {
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  decoBlob1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -40,
    right: -30,
  },
  decoBlob2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 20,
    left: -20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    paddingTop: 52,
  },
  headerLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Avatar ──────────────────────────────────────────────────────────────── */
  avatarSection: {
    alignItems: 'center',
    marginTop: -AVATAR_SIZE / 2,
    zIndex: 10,
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: Colors.background,
    backgroundColor: Colors.surfaceSecondary,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2.5,
    borderColor: Colors.background,
  },

  /* ── Name section ────────────────────────────────────────────────────────── */
  nameSection: {
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: PAD,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  specialty: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 3,
  },
  verifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  verifyText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* ── Stats strip ─────────────────────────────────────────────────────────── */
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: PAD,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textTertiary,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderLight,
  },

  /* ── Info card ───────────────────────────────────────────────────────────── */
  infoCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: PAD,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 16,
  },
  infoCardHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  /* ── Bio ──────────────────────────────────────────────────────────────────── */
  bioBlock: {
    flexDirection: 'row',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  bioAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginRight: 10,
  },
  bioContent: {
    flex: 1,
  },
  bioLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  bioText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  /* ── PMDC cert ───────────────────────────────────────────────────────────── */
  certCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: PAD,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 14,
    paddingBottom: 10,
  },
  certHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  certImage: {
    width: '100%',
    height: 180,
  },

  /* ── Actions ─────────────────────────────────────────────────────────────── */
  actionsSection: {
    backgroundColor: Colors.surface,
    marginHorizontal: PAD,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
});
