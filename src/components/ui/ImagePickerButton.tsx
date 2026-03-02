import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, BorderRadius, Typography, Spacing, Shadows } from '../../constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────
interface ImagePickerButtonProps {
  imageUri: string | null;
  onImagePicked: (asset: ImagePicker.ImagePickerAsset) => void;
  onClear?: () => void;
  /** circular = avatar, rectangular = document / logo */
  shape?: 'circle' | 'rect';
  size?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  aspect?: [number, number];
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ImagePickerButton({
  imageUri,
  onImagePicked,
  onClear,
  shape = 'circle',
  size = 120,
  icon = 'camera-outline',
  label = 'Add Photo',
  aspect = [1, 1],
  style,
}: ImagePickerButtonProps) {
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      // Could show toast here
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImagePicked(result.assets[0]);
    }
  };

  const isCircle = shape === 'circle';
  const containerSize = { width: size, height: isCircle ? size : size * 0.75 };
  const borderRadius = isCircle ? size / 2 : BorderRadius.md;

  return (
    <View style={[styles.wrapper, style]}>
      <TouchableOpacity
        style={[
          styles.container,
          containerSize,
          { borderRadius },
          Shadows.sm,
        ]}
        onPress={pickImage}
        activeOpacity={0.7}
      >
        {imageUri ? (
          <>
            <Image
              source={{ uri: imageUri }}
              style={[styles.image, containerSize, { borderRadius }]}
            />
            {/* Remove button */}
            {onClear && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={onClear}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={24} color={Colors.error} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.iconCircle}>
              <Ionicons name={icon} size={28} color={Colors.primary} />
            </View>
            <Text style={[Typography.caption, styles.label]}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  clearButton: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    color: Colors.primary,
    marginTop: 2,
  },
});
