import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────
export interface FilterTab {
  key: string;
  label: string;
}

interface StatusFilterBarProps {
  tabs: FilterTab[];
  activeKey: string;
  onChange: (key: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function StatusFilterBar({ tabs, activeKey, onChange }: StatusFilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                Typography.bodySmallMedium,
                { color: isActive ? Colors.textInverse : Colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
});
