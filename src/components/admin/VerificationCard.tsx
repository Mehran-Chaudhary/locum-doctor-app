import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import type { AdminVerificationUser } from '../../types';
import { formatRelative } from '../../utils/date';

interface VerificationCardProps {
  user: AdminVerificationUser;
  onApprove: () => void;
  onReject: () => void;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function VerificationCard({
  user,
  onApprove,
  onReject,
  onPress,
  disabled = false,
  style,
}: VerificationCardProps) {
  const isDoctor = user.role === 'DOCTOR';
  const name = isDoctor
    ? `Dr. ${user.doctorProfile?.firstName ?? ''} ${user.doctorProfile?.lastName ?? ''}`
    : user.hospitalProfile?.hospitalName ?? 'Unknown';
  const detail = isDoctor
    ? `${user.doctorProfile?.specialty?.replace(/_/g, ' ') ?? ''} • ${user.doctorProfile?.city ?? ''}`
    : `${user.hospitalProfile?.city ?? ''} • Reg: ${user.hospitalProfile?.healthCommRegNumber ?? ''}`;
  const avatarUrl = isDoctor ? user.doctorProfile?.profilePicUrl : user.hospitalProfile?.logoUrl;
  const identifier = isDoctor
    ? `PMDC: ${user.doctorProfile?.pmdcNumber ?? 'N/A'}`
    : `HC Reg: ${user.hospitalProfile?.healthCommRegNumber ?? 'N/A'}`;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons
              name={isDoctor ? 'person' : 'business'}
              size={20}
              color={Colors.textTertiary}
            />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.detail} numberOfLines={1}>{detail}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: isDoctor ? Colors.primaryLight : Colors.secondaryLight }]}>
          <Text style={[Typography.captionMedium, { color: isDoctor ? Colors.primary : Colors.secondary }]}>
            {user.role}
          </Text>
        </View>
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="id-card-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.infoText}>{identifier}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.infoText} numberOfLines={1}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="call-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.infoText}>{user.phone}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.infoText}>{formatRelative(user.createdAt)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={onReject}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
          <Text style={[Typography.buttonSmall, { color: Colors.error, marginLeft: 4 }]}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={onApprove}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color={Colors.textInverse} />
          <Text style={[Typography.buttonSmall, { color: Colors.textInverse, marginLeft: 4 }]}>Verify</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    ...Typography.bodySemiBold,
    color: Colors.text,
  },
  detail: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  rejectBtn: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  approveBtn: {
    backgroundColor: Colors.success,
  },
});
