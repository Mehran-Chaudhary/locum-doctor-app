import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={Colors.primary} />
        {message && (
          <Text style={[Typography.bodySmallMedium, styles.message]}>{message}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: 'center',
    minWidth: 160,
  },
  message: {
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
});
