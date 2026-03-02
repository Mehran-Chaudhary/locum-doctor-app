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
import { LinearGradient } from 'expo-linear-gradient';

import { useEarningsStore } from '../../stores/earnings.store';
import TransactionCard from '../../components/earnings/TransactionCard';
import { Colors, Spacing } from '../../constants/theme';
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
        {/* ── Page title ──────────────────────────────────────────────────── */}
        <Text style={styles.pageTitle}>My Earnings</Text>

        {/* ── Hero wallet card ────────────────────────────────────────────── */}
        {wallet && (
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Decorative circles */}
            <View style={styles.decoCircle1} />
            <View style={styles.decoCircle2} />

            {/* Available balance — hero */}
            <Text style={styles.heroLabel}>Available Balance</Text>
            <Text style={styles.heroAmount}>{formatPKR(wallet.availableToWithdraw)}</Text>

            {/* Divider */}
            <View style={styles.heroDivider} />

            {/* Sub-row: Pending + Lifetime */}
            <View style={styles.heroSubRow}>
              <View style={styles.heroSubCol}>
                <View style={styles.heroSubIcon}>
                  <Ionicons name="time-outline" size={14} color={Colors.warning} />
                </View>
                <View>
                  <Text style={styles.heroSubLabel}>Pending</Text>
                  <Text style={styles.heroSubValue}>{formatPKR(wallet.pendingClearance)}</Text>
                </View>
              </View>
              <View style={styles.heroSubDivider} />
              <View style={styles.heroSubCol}>
                <View style={styles.heroSubIcon}>
                  <Ionicons name="trending-up" size={14} color={Colors.success} />
                </View>
                <View>
                  <Text style={styles.heroSubLabel}>Lifetime</Text>
                  <Text style={styles.heroSubValue}>{formatPKR(wallet.totalLifetimeEarnings)}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* ── Transactions header ─────────────────────────────────────────── */}
        <View style={styles.txHeader}>
          <Text style={styles.txTitle}>Recent Transactions</Text>
          <Text style={styles.txCount}>{doctorTransactions.length}</Text>
        </View>

        {/* ── Transaction timeline ────────────────────────────────────────── */}
        {doctorTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={28} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyText}>
              No transactions yet. Complete shifts to start earning!
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {doctorTransactions.map((entry, index) => (
              <TransactionCard
                key={entry.id}
                entry={entry}
                isLast={index === doctorTransactions.length - 1}
              />
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xxxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const PAD = 16;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: PAD,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
  },

  /* ── Page title ──────────────────────────────────────────────────────────── */
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: Spacing.lg,
  },

  /* ── Hero wallet card ────────────────────────────────────────────────────── */
  heroCard: {
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  decoCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.decorativeCircle,
  },
  decoCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.decorativeCircleLight,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textOnGradient,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: Colors.overlayLight,
    marginVertical: 16,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroSubCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroSubDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.overlayLight,
    marginHorizontal: 12,
  },
  heroSubIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textOnGradient,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroSubValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 1,
  },

  /* ── Transactions header ─────────────────────────────────────────────────── */
  txHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  txCount: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },

  /* ── Timeline container ──────────────────────────────────────────────────── */
  timeline: {
    paddingLeft: 6,
  },

  /* ── Empty state ─────────────────────────────────────────────────────────── */
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxxl,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 240,
  },
});
