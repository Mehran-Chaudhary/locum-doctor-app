import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { LedgerEntryType, LedgerEntryStatus } from '../../constants/enums';
import { formatPKR, formatDate } from '../../utils/date';
import type { LedgerEntry } from '../../types';

interface TransactionCardProps {
  entry: LedgerEntry;
  style?: object;
}

function typeLabel(type: string): string {
  switch (type) {
    case LedgerEntryType.DOCTOR_NET_EARNING:
      return 'Net Earnings';
    case LedgerEntryType.PLATFORM_COMMISSION:
      return 'Platform Fee';
    case LedgerEntryType.SHIFT_PAYMENT:
      return 'Shift Payment';
    default:
      return type.replace(/_/g, ' ');
  }
}

function typeIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case LedgerEntryType.DOCTOR_NET_EARNING:
      return 'trending-up';
    case LedgerEntryType.PLATFORM_COMMISSION:
      return 'remove-circle-outline';
    case LedgerEntryType.SHIFT_PAYMENT:
      return 'cash-outline';
    default:
      return 'receipt-outline';
  }
}

function typeColor(type: string): string {
  switch (type) {
    case LedgerEntryType.DOCTOR_NET_EARNING:
      return Colors.success;
    case LedgerEntryType.PLATFORM_COMMISSION:
      return Colors.warning;
    case LedgerEntryType.SHIFT_PAYMENT:
      return Colors.primary;
    default:
      return Colors.textSecondary;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case LedgerEntryStatus.PENDING_CLEARANCE:
      return 'Pending';
    case LedgerEntryStatus.CLEARED:
      return 'Cleared';
    case LedgerEntryStatus.WITHDRAWN:
      return 'Withdrawn';
    default:
      return status.replace(/_/g, ' ');
  }
}

function statusColor(status: string): string {
  switch (status) {
    case LedgerEntryStatus.PENDING_CLEARANCE:
      return Colors.warning;
    case LedgerEntryStatus.CLEARED:
      return Colors.success;
    case LedgerEntryStatus.WITHDRAWN:
      return Colors.info;
    default:
      return Colors.textSecondary;
  }
}

/** Extracts the shift name from description like 'Net earnings for "Night Shift MO" — Rs. 16362.00' */
function extractShiftName(description: string | null): string | null {
  if (!description) return null;
  const match = description.match(/"([^"]+)"/);
  return match ? match[1] : null;
}

export default function TransactionCard({ entry, style }: TransactionCardProps) {
  const shiftName = extractShiftName(entry.description);
  const isCommission = entry.type === LedgerEntryType.PLATFORM_COMMISSION;

  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: `${typeColor(entry.type)}15` }]}>
        <Ionicons name={typeIcon(entry.type)} size={20} color={typeColor(entry.type)} />
      </View>

      <View style={styles.content}>
        <Text style={[Typography.bodySmallMedium, { color: Colors.text }]}>
          {typeLabel(entry.type)}
        </Text>
        {shiftName && (
          <Text style={[Typography.caption, { color: Colors.textTertiary }]} numberOfLines={1}>
            {shiftName}
          </Text>
        )}
        <Text style={[Typography.caption, { color: Colors.textTertiary }]}>
          {formatDate(entry.createdAt)}
        </Text>
      </View>

      <View style={styles.amountCol}>
        <Text
          style={[
            Typography.bodySmallSemiBold,
            { color: isCommission ? Colors.warning : typeColor(entry.type) },
          ]}
        >
          {isCommission ? '-' : '+'}{formatPKR(entry.amount)}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor(entry.status)}15` }]}>
          <Text style={[Typography.caption, { color: statusColor(entry.status), fontSize: 10 }]}>
            {statusLabel(entry.status)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  amountCol: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
});
