import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useAdminStore } from '../../stores/admin.store';
import Button from '../../components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import { formatDate, formatPKR } from '../../utils/date';
import { getErrorMessage } from '../../utils/error';

// ─── Status badge helper ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDING_VERIFICATION: { color: Colors.warning, bg: Colors.warningLight, label: 'Pending Verification' },
  VERIFIED: { color: Colors.success, bg: Colors.successLight, label: 'Verified' },
  REJECTED: { color: Colors.error, bg: Colors.errorLight, label: 'Rejected' },
  SUSPENDED: { color: Colors.statusSuspended, bg: Colors.statusSuspendedLight, label: 'Suspended' },
};

export default function AdminUserDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const userId: string = route.params?.userId;

  const {
    userDetail,
    userDetailLoading,
    mutating,
    loadUserDetail,
    suspendUser,
    unsuspendUser,
    verifyUser,
  } = useAdminStore();

  useEffect(() => {
    if (userId) loadUserDetail(userId);
  }, [userId]);

  const onRefresh = useCallback(() => {
    loadUserDetail(userId);
  }, [userId, loadUserDetail]);

  const handleSuspend = () => {
    Alert.alert(
      'Suspend User',
      'This will force the user to log out and block all their actions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              await suspendUser(userId);
              await loadUserDetail(userId);
              Toast.show({ type: 'success', text1: 'User Suspended' });
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(error) });
            }
          },
        },
      ],
    );
  };

  const handleUnsuspend = () => {
    Alert.alert(
      'Unsuspend User',
      'This will restore the user\'s access. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsuspend',
          onPress: async () => {
            try {
              await unsuspendUser(userId);
              await loadUserDetail(userId);
              Toast.show({ type: 'success', text1: 'User Unsuspended' });
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(error) });
            }
          },
        },
      ],
    );
  };

  const handleVerify = () => {
    Alert.alert('Verify User', 'Grant this user full access?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Verify',
        onPress: async () => {
          try {
            await verifyUser(userId, { status: 'VERIFIED', reason: 'Admin verified from detail' });
            await loadUserDetail(userId);
            Toast.show({ type: 'success', text1: 'User Verified' });
          } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(error) });
          }
        },
      },
    ]);
  };

  const handleReject = () => {
    Alert.alert('Reject User', 'Reject this user\'s account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await verifyUser(userId, { status: 'REJECTED', reason: 'Admin rejected from detail' });
            await loadUserDetail(userId);
            Toast.show({ type: 'success', text1: 'User Rejected' });
          } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(error) });
          }
        },
      },
    ]);
  };

  if (userDetailLoading && !userDetail) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.admin} />
      </View>
    );
  }

  if (!userDetail) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="person-remove-outline" size={48} color={Colors.textTertiary} />
          <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: Spacing.lg }]}>
            User not found
          </Text>
          <Button label="Go Back" onPress={() => navigation.goBack()} variant="outline" size="sm" style={{ marginTop: Spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const u = userDetail;
  const isDoctor = u.role === 'DOCTOR';
  const isHospital = u.role === 'HOSPITAL';
  const statusCfg = STATUS_CONFIG[u.status] ?? STATUS_CONFIG.PENDING_VERIFICATION;
  const dp = u.doctorProfile;
  const hp = u.hospitalProfile;
  const avatarUrl = isDoctor ? dp?.profilePicUrl : hp?.logoUrl;
  const displayName = isDoctor
    ? `Dr. ${dp?.firstName ?? ''} ${dp?.lastName ?? ''}`
    : hp?.hospitalName ?? u.email;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={userDetailLoading} onRefresh={onRefresh} tintColor={Colors.admin} />
        }
      >
        {/* Back Button */}
        <Button label="Back" onPress={() => navigation.goBack()} variant="ghost" size="sm" leftIcon="arrow-back" />

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name={isDoctor ? 'person' : 'business'} size={32} color={Colors.textTertiary} />
            </View>
          )}
          <Text style={styles.displayName}>{displayName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[Typography.bodySmallMedium, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
          <Text style={styles.roleText}>{u.role}</Text>
        </View>

        {/* Account Info */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Email" value={u.email} icon="mail-outline" />
          <InfoRow label="Phone" value={u.phone} icon="call-outline" />
          <InfoRow label="Phone Verified" value={u.phoneVerified ? 'Yes' : 'No'} icon="checkmark-circle-outline" />
          <InfoRow label="Joined" value={formatDate(u.createdAt)} icon="calendar-outline" />
          <InfoRow label="Updated" value={formatDate(u.updatedAt)} icon="refresh-outline" last />
        </View>

        {/* Doctor Profile */}
        {isDoctor && dp && (
          <>
            <Text style={styles.sectionTitle}>Doctor Profile</Text>
            <View style={styles.infoCard}>
              <InfoRow label="PMDC Number" value={dp.pmdcNumber} icon="id-card-outline" />
              <InfoRow label="Specialty" value={dp.specialty.replace(/_/g, ' ')} icon="medical-outline" />
              <InfoRow label="Experience" value={`${dp.yearsExperience} years`} icon="school-outline" />
              <InfoRow label="City" value={dp.city} icon="location-outline" />
              <InfoRow label="Hourly Rate" value={formatPKR(dp.hourlyRate)} icon="cash-outline" />
              <InfoRow label="Rating" value={`${dp.averageRating.toFixed(1)} (${dp.totalReviews} reviews)`} icon="star-outline" />
              {dp.bio && <InfoRow label="Bio" value={dp.bio} icon="information-circle-outline" />}
              {dp.pmdcCertUrl && <InfoRow label="PMDC Cert" value="Uploaded" icon="document-attach-outline" last />}
            </View>
          </>
        )}

        {/* Hospital Profile */}
        {isHospital && hp && (
          <>
            <Text style={styles.sectionTitle}>Hospital Profile</Text>
            <View style={styles.infoCard}>
              <InfoRow label="Hospital Name" value={hp.hospitalName} icon="business-outline" />
              <InfoRow label="HC Reg Number" value={hp.healthCommRegNumber} icon="id-card-outline" />
              <InfoRow label="Address" value={hp.address} icon="navigate-outline" />
              <InfoRow label="City" value={hp.city} icon="location-outline" />
              <InfoRow label="Contact Person" value={hp.contactPersonName} icon="person-outline" />
              <InfoRow label="Contact Phone" value={hp.contactPersonPhone} icon="call-outline" />
              {hp.contactPersonEmail && <InfoRow label="Contact Email" value={hp.contactPersonEmail} icon="mail-outline" />}
              <InfoRow label="Rating" value={`${hp.averageRating.toFixed(1)} (${hp.totalReviews} reviews)`} icon="star-outline" last />
            </View>
          </>
        )}

        {/* Actions */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsCard}>
          {u.status === 'PENDING_VERIFICATION' && (
            <>
              <Button
                label="Verify User"
                onPress={handleVerify}
                variant="primary"
                fullWidth
                leftIcon="checkmark-circle-outline"
                loading={mutating}
                style={{ marginBottom: Spacing.md }}
              />
              <Button
                label="Reject User"
                onPress={handleReject}
                variant="danger"
                fullWidth
                leftIcon="close-circle-outline"
                loading={mutating}
              />
            </>
          )}
          {u.status === 'VERIFIED' && u.role !== 'SUPER_ADMIN' && (
            <Button
              label="Suspend User"
              onPress={handleSuspend}
              variant="danger"
              fullWidth
              leftIcon="ban-outline"
              loading={mutating}
            />
          )}
          {u.status === 'SUSPENDED' && (
            <Button
              label="Unsuspend User"
              onPress={handleUnsuspend}
              variant="primary"
              fullWidth
              leftIcon="checkmark-circle-outline"
              loading={mutating}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-Component: InfoRow ───────────────────────────────────────────────────
function InfoRow({ label, value, icon, last = false }: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBordered]}>
      <Ionicons name={icon} size={16} color={Colors.textTertiary} style={{ marginRight: Spacing.sm }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  scroll: { padding: Layout.screenPadding, paddingBottom: 40 },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginVertical: Spacing.lg,
    ...Shadows.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.md,
  },
  avatarFallback: {
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  roleText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  infoRowBordered: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    ...Typography.bodySmallMedium,
    color: Colors.textSecondary,
    width: 110,
  },
  infoValue: {
    ...Typography.bodySmall,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  actionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
});
