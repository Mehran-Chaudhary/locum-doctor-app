import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Layout, Spacing } from '../../constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────
interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  /** Show a "prefix" chip (e.g. "+92") inside the input */
  prefix?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Input({
  label,
  value,
  onChangeText,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  prefix,
  editable = true,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? Colors.error
    : isFocused
      ? Colors.borderFocus
      : Colors.border;

  const iconColor = error
    ? Colors.error
    : isFocused
      ? Colors.primary
      : Colors.textTertiary;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <Text style={[Typography.bodySmallMedium, styles.label, error && { color: Colors.error }]}>
        {label}
      </Text>

      {/* Input Row */}
      <View style={[styles.inputRow, { borderColor }, !editable && styles.disabled]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={20} color={iconColor} style={styles.leftIcon} />
        )}

        {prefix && (
          <Text style={[Typography.body, styles.prefix]}>{prefix}</Text>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
          placeholderTextColor={Colors.textTertiary}
          selectionColor={Colors.primary}
          style={[
            Typography.body,
            styles.input,
            { color: editable ? Colors.text : Colors.textSecondary },
            rest.multiline && styles.multilineInput,
          ]}
          {...rest}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={!onRightIconPress}
          >
            <Ionicons name={rightIcon} size={20} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={Colors.error} />
          <Text style={[Typography.caption, styles.errorText]}>{error}</Text>
        </View>
      ) : null}
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
    marginBottom: Spacing.xs + 2, // 6px
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  disabled: {
    backgroundColor: Colors.disabledBg,
  },
  leftIcon: {
    marginRight: 10,
  },
  prefix: {
    color: Colors.textSecondary,
    marginRight: 4,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
  },
  multilineInput: {
    height: undefined,
    minHeight: Layout.inputHeight,
    textAlignVertical: 'top',
    paddingVertical: 12,
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
});
