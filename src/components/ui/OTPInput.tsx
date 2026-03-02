import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Keyboard,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { Colors, BorderRadius, Typography } from '../../constants/theme';

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

  useEffect(() => {
    // Auto-focus first box
    const timer = setTimeout(() => inputs.current[0]?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

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
      {otp.map((digit, i) => (
        <TextInput
          key={i}
          ref={(ref) => { inputs.current[i] = ref; }}
          value={digit}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          onFocus={() => setFocusedIndex(i)}
          keyboardType="number-pad"
          maxLength={i === 0 ? length : 1} // allow paste on first box
          selectTextOnFocus
          style={[
            styles.box,
            focusedIndex === i && styles.boxFocused,
            digit !== '' && styles.boxFilled,
          ]}
          selectionColor={Colors.primary}
        />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const BOX_SIZE = 50;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE + 6,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  boxFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  boxFilled: {
    borderColor: Colors.text,
  },
});
