import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Layout, Shadows } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'lg' | 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyles: ViewStyle[] = [
    styles.base,
    sizeStyles[size],
    variantStyles[variant],
    isDisabled && disabledContainerStyles[variant],
    fullWidth && styles.fullWidth,
    variant === 'primary' && !isDisabled && Shadows.md,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const textColor = isDisabled
    ? Colors.textTertiary
    : textColors[variant];

  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={containerStyles}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={iconSize}
              color={textColor}
              style={styles.leftIcon}
            />
          )}
          <Text style={[
            size === 'sm' ? Typography.buttonSmall : Typography.button,
            { color: textColor },
          ]}>
            {label}
          </Text>
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={iconSize}
              color={textColor}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Variant Palettes ─────────────────────────────────────────────────────────
const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.secondary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.error },
};

const disabledContainerStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: Colors.disabled },
  secondary: { backgroundColor: Colors.disabled },
  outline: { borderColor: Colors.disabled },
  ghost: {},
  danger: { backgroundColor: Colors.disabled },
};

const textColors: Record<Variant, string> = {
  primary: Colors.textInverse,
  secondary: Colors.textInverse,
  outline: Colors.primary,
  ghost: Colors.primary,
  danger: Colors.textInverse,
};

// ─── Size Styles ──────────────────────────────────────────────────────────────
const sizeStyles: Record<Size, ViewStyle> = {
  lg: { height: Layout.buttonHeight, paddingHorizontal: 24, borderRadius: BorderRadius.md },
  md: { height: Layout.buttonHeightSmall, paddingHorizontal: 20, borderRadius: BorderRadius.md },
  sm: { height: 36, paddingHorizontal: 16, borderRadius: BorderRadius.sm },
};

// ─── Base Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
