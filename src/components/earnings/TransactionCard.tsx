import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { LedgerEntryType, LedgerEntryStatus } from '../../constants/enums';
import { formatPKR, formatDate } from '../../utils/date';
import type { LedgerEntry } from '../../types';

interface TransactionCardProps {
  entry: LedgerEntry;
  /** Whether this is the last item in the timeline (hides connector). */
  isLast?: boolean;
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

export default function TransactionCard({ entry, isLast = false, style }: TransactionCardProps) {
  const shiftName = extractShiftName(entry.description);
  const isCommission = entry.type === LedgerEntryType.PLATFORM_COMMISSION;
  const color = typeColor(entry.type);

  return (
    <View style={[styles.row, style]}>
      {/* ── Timeline track ─────────────────────────────────────────────── */}
      <View style={styles.track}>
        <View style={[styles.dot, { backgroundColor: color }]}>
          <Ionicons name={typeIcon(entry.type)} size={12} color="#FFF" />
        </View>
        {!isLast && <View style={styles.connector} />}
      </View>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Top line: type label + amount */}
        <View style={styles.topLine}>
          <Text style={styles.typeLabel}>{typeLabel(entry.type)}</Text>
          <Text style={[styles.amount, { color: isCommission ? Colors.warning : color }]}>
            {isCommission ? '−' : '+'}{formatPKR(entry.amount)}
          </Text>
        </View>

        {/* Shift name if exists */}
        {shiftName && (
          <Text style={styles.shiftName} numberOfLines={1}>{shiftName}</Text>
        )}

        {/* Bottom line: date + status */}
        <View style={styles.bottomLine}>
          <Text style={styles.dateLabel}>{formatDate(entry.createdAt)}</Text>
          <View style={[styles.statusChip, { backgroundColor: `${statusColor(entry.status)}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(entry.status) }]} />
            <Text style={[styles.statusLabel, { color: statusColor(entry.status) }]}>
              {statusLabel(entry.status)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Row ──────────────────────────────────────────────────────────────────── */
  row: {
    flexDirection: 'row',
    minHeight: 72,
  },

  /* ── Timeline track ──────────────────────────────────────────────────────── */
  track: {
    width: 28,
    alignItems: 'center',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderLight,
    marginTop: 4,
    marginBottom: 0,
    borderRadius: 1,
  },

  /* ── Content ─────────────────────────────────────────────────────────────── */
  content: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 16,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
  shiftName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
