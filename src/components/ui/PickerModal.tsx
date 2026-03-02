import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing, Layout, Shadows } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PickerOption {
  value: string;
  label: string;
}

interface PickerModalProps {
  label: string;
  options: PickerOption[];
  selectedValue: string | null | undefined;
  onSelect: (value: string) => void;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  placeholder?: string;
  searchable?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PickerModal({
  label,
  options,
  selectedValue,
  onSelect,
  error,
  leftIcon,
  placeholder = 'Select...',
  searchable = true,
}: PickerModalProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selectedLabel = options.find((o) => o.value === selectedValue)?.label;

  const filtered = searchable && search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (value: string) => {
    onSelect(value);
    setVisible(false);
    setSearch('');
  };

  const borderColor = error
    ? Colors.error
    : Colors.border;

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={[Typography.bodySmallMedium, styles.label, error && { color: Colors.error }]}>
        {label}
      </Text>

      {/* Trigger */}
      <TouchableOpacity
        style={[styles.trigger, { borderColor }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={selectedValue ? Colors.primary : Colors.textTertiary}
            style={styles.leftIcon}
          />
        )}

        <Text
          style={[
            Typography.body,
            { flex: 1, color: selectedLabel ? Colors.text : Colors.textTertiary },
          ]}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>

        <Ionicons name="chevron-down" size={20} color={Colors.textTertiary} />
      </TouchableOpacity>

      {/* Error */}
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={Colors.error} />
          <Text style={[Typography.caption, styles.errorText]}>{error}</Text>
        </View>
      ) : null}

      {/* Modal */}
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <SafeAreaView style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[Typography.h4, { flex: 1 }]}>{label}</Text>
              <TouchableOpacity onPress={() => { setVisible(false); setSearch(''); }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            {searchable && (
              <View style={styles.searchRow}>
                <Ionicons name="search" size={18} color={Colors.textTertiary} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search..."
                  placeholderTextColor={Colors.textTertiary}
                  style={[Typography.body, styles.searchInput]}
                  autoFocus
                />
              </View>
            )}

            {/* List */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        Typography.body,
                        { flex: 1, color: isSelected ? Colors.primary : Colors.text },
                        isSelected && { fontWeight: '600' },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={[Typography.body, styles.emptyText]}>No results found</Text>
              }
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.text,
    marginBottom: Spacing.xs + 2,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    color: Colors.error,
    marginLeft: 4,
    flex: 1,
  },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.cardPadding,
    paddingVertical: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Layout.cardPadding,
    marginBottom: 12,
    height: 48,
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    padding: 0,
    color: Colors.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.cardPadding,
    paddingVertical: 16,
  },
  optionSelected: {
    backgroundColor: Colors.primarySoft,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginLeft: Layout.cardPadding,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textTertiary,
    paddingVertical: 32,
  },
});
