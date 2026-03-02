import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/theme';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  color?: string;
  emptyColor?: string;
  /** If provided, the component becomes interactive. */
  onRate?: (rating: number) => void;
  style?: object;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 24,
  color = Colors.warning,
  emptyColor = Colors.disabled,
  onRate,
  style,
}: StarRatingProps) {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <View style={[styles.container, style]}>
      {stars.map((star) => {
        const isFilled = star <= rating;
        const starEl = (
          <Ionicons
            key={star}
            name={isFilled ? 'star' : 'star-outline'}
            size={size}
            color={isFilled ? color : emptyColor}
            style={{ marginHorizontal: Spacing.xs / 2 }}
          />
        );

        if (onRate) {
          return (
            <TouchableOpacity key={star} onPress={() => onRate(star)} activeOpacity={0.7}>
              {starEl}
            </TouchableOpacity>
          );
        }

        return starEl;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
