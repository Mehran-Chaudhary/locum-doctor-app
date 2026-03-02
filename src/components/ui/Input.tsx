import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Layout, Spacing, Shadows } from '../../constants/theme';

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
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  const borderColor = error
    ? Colors.error
    : isFocused
      ? Colors.borderFocus
      : Colors.borderSubtle;

  const backgroundColor = error
    ? Colors.errorLight
    : isFocused
      ? Colors.surface
      : Colors.inputBackground;

  const iconColor = error
    ? Colors.error
    : isFocused
      ? Colors.primary
      : Colors.textTertiary;

  const animatedBorderWidth = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <Text style={[Typography.bodySmallSemiBold, styles.label, error && { color: Colors.error }]}>
        {label}
      </Text>

      {/* Input Row */}
      <Animated.View
        style={[
          styles.inputRow,
          {
            borderColor,
            borderWidth: animatedBorderWidth,
            backgroundColor,
          },
          !editable && styles.disabled,
          isFocused && !error && Shadows.sm,
        ]}
      >
        {leftIcon && (
          <View style={styles.iconWrapper}>
            <Ionicons name={leftIcon} size={20} color={iconColor} />
          </View>
        )}

        {prefix && (
          <View style={styles.prefixContainer}>
            <Text style={[Typography.bodyMedium, styles.prefix]}>{prefix}</Text>
          </View>
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
            style={styles.rightIconBtn}
          >
            <Ionicons name={rightIcon} size={20} color={iconColor} />
          </TouchableOpacity>
        )}
      </Animated.View>

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
    marginBottom: Spacing.lg + 2,
  },
  label: {
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
  },
  disabled: {
    backgroundColor: Colors.disabledBg,
    opacity: 0.7,
  },
  iconWrapper: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
  },
  prefixContainer: {
    marginRight: 6,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    height: 28,
    justifyContent: 'center',
  },
  prefix: {
    color: Colors.textSecondary,
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
    paddingVertical: 14,
  },
  rightIconBtn: {
    marginLeft: 8,
    padding: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingLeft: 2,
  },
  errorText: {
    color: Colors.error,
    marginLeft: 6,
    flex: 1,
  },
});
