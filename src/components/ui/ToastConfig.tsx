import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';
import type { BaseToastProps } from 'react-native-toast-message';

// ─── Custom Toast Configs for react-native-toast-message ──────────────────────
export const toastConfig = {
  success: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.container, styles.success]}>
      <View style={[styles.iconContainer, { backgroundColor: Colors.successLight }]}>
        <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
      </View>
      <View style={styles.textContainer}>
        {text1 ? <Text style={[Typography.bodySmallMedium, styles.title]}>{text1}</Text> : null}
        {text2 ? <Text style={[Typography.caption, styles.subtitle]}>{text2}</Text> : null}
      </View>
    </View>
  ),

  error: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.container, styles.error]}>
      <View style={[styles.iconContainer, { backgroundColor: Colors.errorLight }]}>
        <Ionicons name="alert-circle" size={22} color={Colors.error} />
      </View>
      <View style={styles.textContainer}>
        {text1 ? <Text style={[Typography.bodySmallMedium, styles.title]}>{text1}</Text> : null}
        {text2 ? <Text style={[Typography.caption, styles.subtitle]}>{text2}</Text> : null}
      </View>
    </View>
  ),

  info: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.container, styles.info]}>
      <View style={[styles.iconContainer, { backgroundColor: Colors.infoLight }]}>
        <Ionicons name="information-circle" size={22} color={Colors.info} />
      </View>
      <View style={styles.textContainer}>
        {text1 ? <Text style={[Typography.bodySmallMedium, styles.title]}>{text1}</Text> : null}
        {text2 ? <Text style={[Typography.caption, styles.subtitle]}>{text2}</Text> : null}
      </View>
    </View>
  ),

  warning: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.container, styles.warning]}>
      <View style={[styles.iconContainer, { backgroundColor: Colors.warningLight }]}>
        <Ionicons name="warning" size={22} color={Colors.warning} />
      </View>
      <View style={styles.textContainer}>
        {text1 ? <Text style={[Typography.bodySmallMedium, styles.title]}>{text1}</Text> : null}
        {text2 ? <Text style={[Typography.caption, styles.subtitle]}>{text2}</Text> : null}
      </View>
    </View>
  ),

  /** Show a dev-only OTP / token banner */
  dev: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.container, styles.dev]}>
      <View style={[styles.iconContainer, { backgroundColor: '#F5F3FF' }]}>
        <Ionicons name="code-slash" size={22} color="#7C3AED" />
      </View>
      <View style={styles.textContainer}>
        {text1 ? <Text style={[Typography.bodySmallMedium, styles.title]}>{text1}</Text> : null}
        {text2 ? (
          <Text style={[Typography.captionMedium, { color: '#7C3AED' }]} selectable>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: 4,
  },
  success: { borderLeftColor: Colors.success },
  error: { borderLeftColor: Colors.error },
  info: { borderLeftColor: Colors.info },
  warning: { borderLeftColor: Colors.warning },
  dev: { borderLeftColor: '#7C3AED' },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: Colors.text,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
