import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAdminStore } from '../../stores/admin.store';
import { useAuthStore } from '../../stores/auth.store';
import StatCard from '../../components/admin/StatCard';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import { formatPKR } from '../../utils/date';

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminDashboardScreen() {
  const { stats, statsLoading, loadStats } = useAdminStore();
  const { logout } = useAuthStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = useCallback(() => {
    loadStats();
  }, [loadStats]);

  if (statsLoading && !stats) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.admin} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={statsLoading} onRefresh={onRefresh} tintColor={Colors.admin} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[Typography.h3, { color: Colors.text }]}>Admin Dashboard</Text>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>
              Platform overview
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {stats && (
          <>
            {/* ── Quick Actions ──────────────────────────────────────────── */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('Verifications')}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.warningLight }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={Colors.warning} />
                </View>
                <Text style={styles.quickActionLabel}>Verifications</Text>
                {stats.users.pendingVerifications > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{stats.users.pendingVerifications}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('Disputes')}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.errorLight }]}>
                  <Ionicons name="flag-outline" size={20} color={Colors.error} />
                </View>
                <Text style={styles.quickActionLabel}>Disputes</Text>
                {stats.timesheets.disputedTimesheets > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{stats.timesheets.disputedTimesheets}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('Revenue')}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.successLight }]}>
                  <Ionicons name="trending-up-outline" size={20} color={Colors.success} />
                </View>
                <Text style={styles.quickActionLabel}>Revenue</Text>
              </TouchableOpacity>
            </View>

            {/* ── Users Stats ────────────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Users</Text>
            <View style={styles.statsRow}>
              <StatCard
                title="Total Users"
                value={stats.users.totalUsers}
                icon="people"
                iconColor={Colors.admin}
                iconBg={Colors.statusSuspendedLight}
              />
              <StatCard
                title="Doctors"
                value={`${stats.users.verifiedDoctors} / ${stats.users.totalDoctors}`}
                icon="person"
                iconColor={Colors.primary}
                iconBg={Colors.primaryLight}
                subtitle="verified / total"
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                title="Hospitals"
                value={`${stats.users.verifiedHospitals} / ${stats.users.totalHospitals}`}
                icon="business"
                iconColor={Colors.secondary}
                iconBg={Colors.secondaryLight}
                subtitle="verified / total"
              />
              <StatCard
                title="Pending"
                value={stats.users.pendingVerifications}
                icon="hourglass"
                iconColor={Colors.warning}
                iconBg={Colors.warningLight}
                subtitle="awaiting review"
              />
            </View>

            {/* ── Shifts Stats ───────────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Shifts</Text>
            <View style={styles.statsRow}>
              <StatCard
                title="Total Shifts"
                value={stats.shifts.totalShifts}
                icon="briefcase"
                iconColor={Colors.text}
                iconBg={Colors.surfaceSecondary}
              />
              <StatCard
                title="Open"
                value={stats.shifts.openShifts}
                icon="radio-button-on"
                iconColor={Colors.success}
                iconBg={Colors.successLight}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                title="Filled"
                value={stats.shifts.filledShifts}
                icon="checkbox"
                iconColor={Colors.info}
                iconBg={Colors.infoLight}
              />
              <StatCard
                title="Completed"
                value={stats.shifts.completedShifts}
                icon="checkmark-done"
                iconColor={Colors.secondary}
                iconBg={Colors.secondaryLight}
              />
            </View>

            {/* ── Timesheets & Applications ───────────────────────────────── */}
            <Text style={styles.sectionTitle}>Activity</Text>
            <View style={styles.statsRow}>
              <StatCard
                title="Applications"
                value={stats.applications.totalApplications}
                icon="paper-plane"
                iconColor={Colors.primary}
                iconBg={Colors.primaryLight}
              />
              <StatCard
                title="Timesheets"
                value={stats.timesheets.totalTimesheets}
                icon="document-text"
                iconColor={Colors.secondary}
                iconBg={Colors.secondaryLight}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                title="Pending TS"
                value={stats.timesheets.pendingTimesheets}
                icon="time"
                iconColor={Colors.warning}
                iconBg={Colors.warningLight}
                subtitle="awaiting approval"
              />
              <StatCard
                title="Disputed"
                value={stats.timesheets.disputedTimesheets}
                icon="flag"
                iconColor={Colors.error}
                iconBg={Colors.errorLight}
                subtitle="needs attention"
              />
            </View>

            {/* ── Financial Stats ─────────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Financial</Text>
            <View style={styles.financialCard}>
              <View style={styles.financialRow}>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Total Revenue</Text>
                  <Text style={[styles.financialValue, { color: Colors.success }]}>
                    {formatPKR(stats.financial.totalRevenue)}
                  </Text>
                </View>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Platform Commission</Text>
                  <Text style={[styles.financialValue, { color: Colors.admin }]}>
                    {formatPKR(stats.financial.totalPlatformCommission)}
                  </Text>
                </View>
              </View>
              <View style={styles.financialRow}>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Doctor Payouts</Text>
                  <Text style={[styles.financialValue, { color: Colors.primary }]}>
                    {formatPKR(stats.financial.totalDoctorPayouts)}
                  </Text>
                </View>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Pending Clearance</Text>
                  <Text style={[styles.financialValue, { color: Colors.warning }]}>
                    {stats.financial.pendingLedgerEntries}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Reviews ─────────────────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Reviews</Text>
            <View style={styles.statsRow}>
              <StatCard
                title="Total Reviews"
                value={stats.reviews.totalReviews}
                icon="star"
                iconColor={Colors.warning}
                iconBg={Colors.warningLight}
              />
              <StatCard
                title="Expired Shifts"
                value={stats.shifts.expiredShifts}
                icon="alert-circle"
                iconColor={Colors.textTertiary}
                iconBg={Colors.surfaceSecondary}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  scroll: { padding: Layout.screenPadding, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    ...Typography.captionMedium,
    color: Colors.text,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...Typography.captionMedium,
    color: Colors.textInverse,
    fontSize: 11,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  financialCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  financialRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  financialItem: {
    flex: 1,
  },
  financialLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  financialValue: {
    ...Typography.h4,
  },
});
