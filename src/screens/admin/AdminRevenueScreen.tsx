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

import { useAdminStore } from '../../stores/admin.store';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import { formatPKR } from '../../utils/date';
import type { AdminRevenueMonth } from '../../types';

export default function AdminRevenueScreen() {
  const { revenueByMonth, revenueLoading, loadRevenue } = useAdminStore();

  useEffect(() => {
    loadRevenue();
  }, []);

  const onRefresh = useCallback(() => {
    loadRevenue();
  }, [loadRevenue]);

  // Calculate totals
  const totals = revenueByMonth.reduce(
    (acc, m) => ({
      shiftPayments: acc.shiftPayments + parseFloat(m.shiftPayments),
      platformCommission: acc.platformCommission + parseFloat(m.platformCommission),
      doctorPayouts: acc.doctorPayouts + parseFloat(m.doctorPayouts),
    }),
    { shiftPayments: 0, platformCommission: 0, doctorPayouts: 0 },
  );

  // Find max for simple bar chart scaling
  const maxPayment = Math.max(...revenueByMonth.map((m) => parseFloat(m.shiftPayments)), 1);

  if (revenueLoading && revenueByMonth.length === 0) {
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
          <RefreshControl refreshing={revenueLoading} onRefresh={onRefresh} tintColor={Colors.admin} />
        }
      >
        {/* Header */}
        <Text style={[Typography.h3, { color: Colors.text, marginBottom: Spacing.xxl }]}>
          Revenue Analytics
        </Text>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.success }]}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              {formatPKR(totals.shiftPayments)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.admin }]}>
            <Text style={styles.summaryLabel}>Platform Fees</Text>
            <Text style={[styles.summaryValue, { color: Colors.admin }]}>
              {formatPKR(totals.platformCommission)}
            </Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.primary }]}>
            <Text style={styles.summaryLabel}>Doctor Payouts</Text>
            <Text style={[styles.summaryValue, { color: Colors.primary }]}>
              {formatPKR(totals.doctorPayouts)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.secondary }]}>
            <Text style={styles.summaryLabel}>Commission Rate</Text>
            <Text style={[styles.summaryValue, { color: Colors.secondary }]}>10%</Text>
          </View>
        </View>

        {/* Bar Chart (Simple visual) */}
        <Text style={styles.sectionTitle}>Monthly Revenue (Last 12 Months)</Text>
        <View style={styles.chartCard}>
          {revenueByMonth.map((month) => (
            <MonthBar key={month.month} month={month} maxValue={maxPayment} />
          ))}
        </View>

        {/* Detailed Table */}
        <Text style={styles.sectionTitle}>Breakdown</Text>
        <View style={styles.tableCard}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.2 }]}>Month</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Revenue</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Commission</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Payouts</Text>
          </View>

          {/* Table Data — show in reverse (most recent first) */}
          {[...revenueByMonth].reverse().map((m, idx) => (
            <View
              key={m.month}
              style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatMonth(m.month)}</Text>
              <Text style={styles.tableCell}>{formatCompact(m.shiftPayments)}</Text>
              <Text style={styles.tableCell}>{formatCompact(m.platformCommission)}</Text>
              <Text style={styles.tableCell}>{formatCompact(m.doctorPayouts)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Month Bar Sub-Component ──────────────────────────────────────────────────
function MonthBar({ month, maxValue }: { month: AdminRevenueMonth; maxValue: number }) {
  const barWidth = Math.max((parseFloat(month.shiftPayments) / maxValue) * 100, 2);
  const hasData = parseFloat(month.shiftPayments) > 0;

  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{formatMonth(month.month)}</Text>
      <View style={barStyles.barTrack}>
        <View style={[barStyles.barFill, { width: `${barWidth}%` }]} />
      </View>
      <Text style={barStyles.value}>
        {hasData ? formatCompact(month.shiftPayments) : '—'}
      </Text>
    </View>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function formatMonth(ym: string): string {
  const [year, month] = ym.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} '${year.slice(2)}`;
}

function formatCompact(value: string): string {
  const num = parseFloat(value);
  if (num === 0) return 'Rs. 0';
  if (num >= 1_000_000) return `Rs. ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `Rs. ${(num / 1_000).toFixed(0)}K`;
  return `Rs. ${num.toFixed(0)}`;
}

// ─── MonthBar Styles ──────────────────────────────────────────────────────────
const barStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    width: 52,
  },
  barTrack: {
    flex: 1,
    height: 18,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.xs,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.admin,
    borderRadius: BorderRadius.xs,
  },
  value: {
    ...Typography.captionMedium,
    color: Colors.text,
    width: 64,
    textAlign: 'right',
  },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  scroll: { padding: Layout.screenPadding, paddingBottom: 40 },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderLeftWidth: 3,
    ...Shadows.sm,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    ...Typography.h4,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  tableCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  tableHeaderRow: {
    backgroundColor: Colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tableRowAlt: {
    backgroundColor: Colors.surfaceSecondary + '60',
  },
  tableCell: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  tableHeaderText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
});
