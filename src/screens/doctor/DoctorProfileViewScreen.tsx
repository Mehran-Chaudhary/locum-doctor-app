import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { SPECIALTY_OPTIONS } from '../../constants/enums';
import { Colors, Typography, Spacing, Layout, BorderRadius, Shadows } from '../../constants/theme';

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DoctorProfileViewScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const p = user?.doctorProfile;

  if (!p) return null;

  const specialtyLabel = SPECIALTY_OPTIONS.find((o) => o.value === p.specialty)?.label ?? p.specialty;

  const InfoRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | null | undefined }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={[Typography.caption, { color: Colors.textSecondary }]}>{label}</Text>
        <Text style={[Typography.bodySmallMedium, { color: Colors.text }]}>{value || '—'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar & Name */}
        <View style={styles.headerSection}>
          {p.profilePicUrl ? (
            <Image source={{ uri: p.profilePicUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={40} color={Colors.textTertiary} />
            </View>
          )}
          <Text style={[Typography.h3, { color: Colors.text, marginTop: Spacing.md }]}>
            Dr. {p.firstName} {p.lastName}
          </Text>
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>
            {specialtyLabel}
          </Text>

          {/* Rating Badge */}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color={Colors.warning} />
            <Text style={[Typography.bodySmallMedium, { color: Colors.text, marginLeft: 4 }]}>
              {p.averageRating ? p.averageRating.toFixed(1) : 'New'}
            </Text>
            <Text style={[Typography.caption, { color: Colors.textTertiary, marginLeft: 4 }]}>
              ({p.totalReviews} reviews)
            </Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <InfoRow icon="location-outline" label="City" value={p.city} />
          <InfoRow icon="id-card-outline" label="PMDC Number" value={p.pmdcNumber} />
          <InfoRow icon="medical-outline" label="Specialty" value={specialtyLabel} />
          <InfoRow icon="time-outline" label="Experience" value={`${p.yearsExperience} years`} />
          <InfoRow icon="cash-outline" label="Hourly Rate" value={`Rs. ${Number(p.hourlyRate).toLocaleString()}`} />
          {p.bio ? <InfoRow icon="document-text-outline" label="Bio" value={p.bio} /> : null}
        </View>

        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: Colors.statusVerifiedLight }]}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.statusVerified} />
            <Text style={[Typography.captionMedium, { color: Colors.statusVerified, marginLeft: 4 }]}>
              {user?.status?.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <Button
          label="Edit Profile"
          onPress={() => navigation?.navigate?.('EditDoctorProfile')}
          variant="outline"
          fullWidth
          leftIcon="create-outline"
          style={{ marginTop: Spacing.lg }}
        />

        <Button
          label="Sign Out"
          onPress={logout}
          variant="ghost"
          fullWidth
          leftIcon="log-out-outline"
          style={{ marginTop: Spacing.md, marginBottom: Spacing.xxxl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxxl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoText: {
    flex: 1,
  },
  statusRow: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
});
