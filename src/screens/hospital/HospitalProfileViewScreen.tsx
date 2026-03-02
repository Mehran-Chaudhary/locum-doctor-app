import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { Colors, Typography, Spacing, Layout, BorderRadius, Shadows } from '../../constants/theme';

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HospitalProfileViewScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const p = user?.hospitalProfile;

  if (!p) return null;

  const InfoRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | null | undefined }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={Colors.hospital} />
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
        {/* Logo & Name */}
        <View style={styles.headerSection}>
          {p.logoUrl ? (
            <Image source={{ uri: p.logoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="business" size={40} color={Colors.textTertiary} />
            </View>
          )}
          <Text style={[Typography.h3, { color: Colors.text, marginTop: Spacing.md }]}>
            {p.hospitalName}
          </Text>
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>
            {p.city}
          </Text>

          {/* Rating */}
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
          <InfoRow icon="business-outline" label="Hospital Name" value={p.hospitalName} />
          <InfoRow icon="location-outline" label="Address" value={p.address} />
          <InfoRow icon="map-outline" label="City" value={p.city} />
          <InfoRow icon="id-card-outline" label="HC Registration" value={p.healthCommRegNumber} />
        </View>

        {/* Contact Card */}
        <Text style={[Typography.bodySemiBold, { color: Colors.text, marginTop: Spacing.xxl, marginBottom: Spacing.md }]}>
          Contact Person
        </Text>
        <View style={styles.card}>
          <InfoRow icon="person-outline" label="Name" value={p.contactPersonName} />
          <InfoRow icon="call-outline" label="Phone" value={p.contactPersonPhone} />
          <InfoRow icon="mail-outline" label="Email" value={p.contactPersonEmail} />
        </View>

        {/* Status */}
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
          onPress={() => navigation?.navigate?.('EditHospitalProfile')}
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
    borderColor: Colors.secondaryLight,
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
    backgroundColor: Colors.secondaryLight,
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
