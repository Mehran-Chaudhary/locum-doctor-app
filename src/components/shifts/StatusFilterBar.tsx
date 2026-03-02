import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

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
    <View style={styles.wrapper}>
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
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  container: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    fontWeight: '600',
    color: Colors.primary,
  },
});
