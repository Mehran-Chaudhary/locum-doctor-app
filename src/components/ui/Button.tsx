import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  View,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  }, [scaleAnim]);

  const textColor = isDisabled ? Colors.textTertiary : textColors[variant];
  const iconSize = size === 'sm' ? 16 : 20;
  const sizeStyle = sizeStyles[size];
  const useGradient = (variant === 'primary' || variant === 'secondary' || variant === 'danger') && !isDisabled;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {leftIcon && (
            <Ionicons name={leftIcon} size={iconSize} color={textColor} style={styles.leftIcon} />
          )}
          <Text style={[size === 'sm' ? Typography.buttonSmall : Typography.button, { color: textColor }]}>
            {label}
          </Text>
          {rightIcon && (
            <Ionicons name={rightIcon} size={iconSize} color={textColor} style={styles.rightIcon} />
          )}
        </>
      )}
    </View>
  );

  if (useGradient) {
    const gradientColors = variant === 'danger'
      ? ['#EF4444', '#DC2626'] as const
      : variant === 'secondary'
        ? ['#0891B2', '#0E7490'] as const
        : [Colors.primary, Colors.primaryDark] as const;

    return (
      <Animated.View style={[fullWidth && styles.fullWidth, { transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity
          onPress={onPress}
          disabled={isDisabled}
          activeOpacity={0.85}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, sizeStyle, Shadows.colored, fullWidth && styles.fullWidth]}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const containerStyles: ViewStyle[] = [
    styles.base,
    sizeStyle,
    variantStyles[variant],
    isDisabled && disabledContainerStyles[variant],
    fullWidth && styles.fullWidth,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={containerStyles}
      >
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Variant Palettes ─────────────────────────────────────────────────────────
const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.secondary },
  outline: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.error },
};

const disabledContainerStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: Colors.disabled },
  secondary: { backgroundColor: Colors.disabled },
  outline: { borderColor: Colors.disabled, backgroundColor: Colors.disabledBg },
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
  lg: { height: Layout.buttonHeight, paddingHorizontal: 28, borderRadius: BorderRadius.md },
  md: { height: Layout.buttonHeightSmall, paddingHorizontal: 22, borderRadius: BorderRadius.md },
  sm: { height: 38, paddingHorizontal: 18, borderRadius: BorderRadius.sm },
};

// ─── Base Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
