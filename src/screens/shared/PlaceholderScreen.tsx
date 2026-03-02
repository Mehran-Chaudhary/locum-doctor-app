import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout } from '../../constants/theme';

interface Props {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
}

/** Generic placeholder screen used for tabs not yet implemented. */
export default function PlaceholderScreen({
  title = 'Coming Soon',
  icon = 'construct-outline',
  subtitle = 'This feature will be available in a future update.',
}: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={40} color={Colors.primary} />
        </View>
        <Text style={[Typography.h3, styles.title]}>{title}</Text>
        <Text style={[Typography.bodySmall, styles.subtitle]}>{subtitle}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  title: { color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  subtitle: { color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xxl },
});
