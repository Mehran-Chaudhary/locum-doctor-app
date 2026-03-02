import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Keyboard,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Animated,
} from 'react-native';
import { Colors, BorderRadius, Typography, Shadows } from '../../constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────
interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  /** If true, auto-submit once all digits are entered */
  autoSubmit?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function OTPInput({ length = 6, onComplete, autoSubmit = true }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputs = useRef<(TextInput | null)[]>([]);
  const scaleAnims = useRef(Array.from({ length }, () => new Animated.Value(1))).current;

  useEffect(() => {
    // Auto-focus first box
    const timer = setTimeout(() => inputs.current[0]?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const animateFocus = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 1.08,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  const animateBlur = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handleChange = (text: string, index: number) => {
    // Handle paste (multi-char)
    if (text.length > 1) {
      const chars = text.replace(/[^0-9]/g, '').slice(0, length).split('');
      const newOtp = [...otp];
      chars.forEach((ch, i) => {
        if (index + i < length) newOtp[index + i] = ch;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, length - 1);
      inputs.current[nextIndex]?.focus();
      const code = newOtp.join('');
      if (code.length === length && autoSubmit) {
        Keyboard.dismiss();
        onComplete(code);
      }
      return;
    }

    const digit = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    const code = newOtp.join('');
    if (code.length === length && autoSubmit) {
      Keyboard.dismiss();
      onComplete(code);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {otp.map((digit, i) => {
        const isFocused = focusedIndex === i;
        const isFilled = digit !== '';

        return (
          <Animated.View
            key={i}
            style={[
              styles.boxWrapper,
              { transform: [{ scale: scaleAnims[i] }] },
              isFocused && Shadows.md,
            ]}
          >
            <TextInput
              ref={(ref) => { inputs.current[i] = ref; }}
              value={digit}
              onChangeText={(text) => handleChange(text, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              onFocus={() => {
                setFocusedIndex(i);
                animateFocus(i);
              }}
              onBlur={() => animateBlur(i)}
              keyboardType="number-pad"
              maxLength={i === 0 ? length : 1}
              selectTextOnFocus
              style={[
                styles.box,
                isFocused && styles.boxFocused,
                isFilled && !isFocused && styles.boxFilled,
              ]}
              selectionColor={Colors.primary}
            />
            {isFocused && !isFilled && <View style={styles.cursor} />}
          </Animated.View>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const BOX_SIZE = 52;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  boxWrapper: {
    position: 'relative',
    borderRadius: BorderRadius.md,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE + 8,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.inputBackground,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  boxFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    borderWidth: 2.5,
  },
  boxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  cursor: {
    position: 'absolute',
    bottom: 14,
    left: BOX_SIZE / 2 - 10,
    width: 20,
    height: 2.5,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});
