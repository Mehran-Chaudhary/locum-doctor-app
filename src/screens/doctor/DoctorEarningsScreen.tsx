import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useEarningsStore } from '../../stores/earnings.store';
import TransactionCard from '../../components/earnings/TransactionCard';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import { LedgerEntryType } from '../../constants/enums';
import { formatPKR } from '../../utils/date';

// ─── Component ────────────────────────────────────────────────────────────────
export default function DoctorEarningsScreen() {
  const { wallet, recentTransactions, isLoading, loadDoctorEarnings } = useEarningsStore();

  useEffect(() => {
    loadDoctorEarnings();
  }, []);

  const onRefresh = useCallback(() => {
    loadDoctorEarnings();
  }, [loadDoctorEarnings]);

  // Filter to show only doctor-relevant transactions (net earnings + commissions)
  const doctorTransactions = recentTransactions.filter(
    (t) => t.type === LedgerEntryType.DOCTOR_NET_EARNING || t.type === LedgerEntryType.PLATFORM_COMMISSION,
  );

  if (isLoading && !wallet) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.doctor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.doctor} />
        }
      >
        {/* Header */}
        <Text style={[Typography.h3, { color: Colors.text, marginBottom: Spacing.xxl }]}>
          My Earnings
        </Text>

        {/* Wallet Cards */}
        {wallet && (
          <View style={styles.walletContainer}>
            {/* Pending */}
            <View style={styles.walletCard}>
              <View style={[styles.walletIcon, { backgroundColor: Colors.warningLight }]}>
                <Ionicons name="time-outline" size={20} color={Colors.warning} />
              </View>
              <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.sm }]}>
                Pending Clearance
              </Text>
              <Text style={[Typography.h3, { color: Colors.warning }]}>
                {formatPKR(wallet.pendingClearance)}
              </Text>
              <Text style={[Typography.caption, { color: Colors.textTertiary }]}>Processing...</Text>
            </View>

            {/* Available */}
            <View style={styles.walletCard}>
              <View style={[styles.walletIcon, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="wallet-outline" size={20} color={Colors.success} />
              </View>
              <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.sm }]}>
                Available to Withdraw
              </Text>
              <Text style={[Typography.h3, { color: Colors.success }]}>
                {formatPKR(wallet.availableToWithdraw)}
              </Text>
              <Text style={[Typography.caption, { color: Colors.textTertiary }]}>Ready</Text>
            </View>

            {/* Lifetime */}
            <View style={[styles.walletCardFull]}>
              <View style={[styles.walletIcon, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="bar-chart-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
                  Total Lifetime Earnings
                </Text>
                <Text style={[Typography.h3, { color: Colors.primary }]}>
                  {formatPKR(wallet.totalLifetimeEarnings)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <Text style={[Typography.bodySemiBold, { color: Colors.text, marginTop: Spacing.xxl, marginBottom: Spacing.lg }]}>
          Recent Transactions
        </Text>

        {doctorTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={40} color={Colors.textTertiary} />
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: Spacing.md }]}>
              No transactions yet. Complete shifts to start earning!
            </Text>
          </View>
        ) : (
          doctorTransactions.map((entry) => (
            <TransactionCard key={entry.id} entry={entry} />
          ))
        )}

        <View style={{ height: Spacing.xxxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxxl,
  },
  walletContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  walletCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  walletCardFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xxxl,
    alignItems: 'center',
    ...Shadows.sm,
  },
});
