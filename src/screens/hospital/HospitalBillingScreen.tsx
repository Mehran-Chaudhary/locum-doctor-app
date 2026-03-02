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

import { useBillingStore } from '../../stores/billing.store';
import TransactionCard from '../../components/earnings/TransactionCard';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import { formatPKR } from '../../utils/date';

// ─── Component ────────────────────────────────────────────────────────────────
export default function HospitalBillingScreen() {
  const { hospitalName, billing, recentTransactions, isLoading, loadHospitalBilling } = useBillingStore();

  useEffect(() => {
    loadHospitalBilling();
  }, []);

  const onRefresh = useCallback(() => {
    loadHospitalBilling();
  }, [loadHospitalBilling]);

  if (isLoading && !billing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.hospital} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.hospital} />
        }
      >
        {/* Header */}
        <Text style={[Typography.h3, { color: Colors.text }]}>Billing</Text>
        {hospitalName ? (
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.xxl }]}>
            {hospitalName}
          </Text>
        ) : (
          <View style={{ marginBottom: Spacing.xxl }} />
        )}

        {/* Billing Summary */}
        {billing && (
          <View style={styles.billingContainer}>
            {/* Row 1: This Month + Total Spent */}
            <View style={styles.billingRow}>
              <View style={styles.billingCard}>
                <View style={[styles.billingIcon, { backgroundColor: Colors.primaryLight }]}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                </View>
                <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.sm }]}>
                  This Month
                </Text>
                <Text style={[Typography.h4, { color: Colors.primary }]}>
                  {formatPKR(billing.currentMonthSpend)}
                </Text>
              </View>

              <View style={styles.billingCard}>
                <View style={[styles.billingIcon, { backgroundColor: Colors.secondaryLight }]}>
                  <Ionicons name="trending-up" size={18} color={Colors.hospital} />
                </View>
                <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.sm }]}>
                  Total Spent
                </Text>
                <Text style={[Typography.h4, { color: Colors.hospital }]}>
                  {formatPKR(billing.totalSpent)}
                </Text>
              </View>
            </View>

            {/* Row 2: Platform Fees + Outstanding */}
            <View style={styles.billingRow}>
              <View style={styles.billingCard}>
                <View style={[styles.billingIcon, { backgroundColor: Colors.warningLight }]}>
                  <Ionicons name="pricetag-outline" size={18} color={Colors.warning} />
                </View>
                <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.sm }]}>
                  Platform Fees
                </Text>
                <Text style={[Typography.h4, { color: Colors.warning }]}>
                  {formatPKR(billing.totalPlatformFees)}
                </Text>
              </View>

              <View style={styles.billingCard}>
                <View style={[styles.billingIcon, { backgroundColor: Colors.errorLight }]}>
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
                </View>
                <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.sm }]}>
                  Outstanding
                </Text>
                <Text style={[Typography.h4, { color: Colors.error }]}>
                  {formatPKR(billing.outstandingInvoices.amount)}
                </Text>
                <Text style={[Typography.caption, { color: Colors.textTertiary }]}>
                  {billing.outstandingInvoices.count} invoice{billing.outstandingInvoices.count !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <Text style={[Typography.bodySemiBold, { color: Colors.text, marginTop: Spacing.xxl, marginBottom: Spacing.lg }]}>
          Recent Transactions
        </Text>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={40} color={Colors.textTertiary} />
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: Spacing.md }]}>
              No billing transactions yet.
            </Text>
          </View>
        ) : (
          recentTransactions.map((entry) => (
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
  billingContainer: {
    gap: Spacing.md,
  },
  billingRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  billingCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  billingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
