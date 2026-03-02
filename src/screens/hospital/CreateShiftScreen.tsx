import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';

import { useShiftStore } from '../../stores/shift.store';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PickerModal from '../../components/ui/PickerModal';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../../constants/theme';
import { DEPARTMENT_OPTIONS, SPECIALTY_OPTIONS, ShiftUrgency } from '../../constants/enums';
import { formatPKR, formatShiftRange, calcDurationHrs, formatDuration } from '../../utils/date';
import { getErrorMessage } from '../../utils/error';
import type { CreateShiftRequest } from '../../types';
import type { Department, Specialty } from '../../constants/enums';

// ─── Component ────────────────────────────────────────────────────────────────
export default function CreateShiftScreen() {
  const navigation = useNavigation();
  const { createShift } = useShiftStore();

  // ── Form state ─────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [urgency, setUrgency] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [startTime, setStartTime] = useState(new Date(Date.now() + 24 * 60 * 60_000)); // tomorrow
  const [endTime, setEndTime] = useState(new Date(Date.now() + 36 * 60 * 60_000)); // tomorrow + 12h

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Validation ─────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!department) e.department = 'Department is required';
    if (!specialty) e.specialty = 'Specialty is required';
    if (!hourlyRate || isNaN(parseFloat(hourlyRate)) || parseFloat(hourlyRate) <= 0)
      e.hourlyRate = 'Enter a valid hourly rate';
    if (startTime <= new Date()) e.startTime = 'Start time must be in the future';
    if (endTime <= startTime) e.endTime = 'End time must be after start time';
    const duration = calcDurationHrs(startTime.toISOString(), endTime.toISOString());
    if (duration < 2) e.endTime = 'Shift must be at least 2 hours long';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [title, department, specialty, hourlyRate, startTime, endTime]);

  // ── Preview calculation ────────────────────────────────────────────────
  const preview = useMemo(() => {
    const durationHrs = calcDurationHrs(startTime.toISOString(), endTime.toISOString());
    const rate = parseFloat(hourlyRate) || 0;
    return {
      duration: durationHrs > 0 ? durationHrs : 0,
      totalPay: durationHrs > 0 && rate > 0 ? durationHrs * rate : 0,
    };
  }, [startTime, endTime, hourlyRate]);

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const body: CreateShiftRequest = {
        title: title.trim(),
        department: department as Department,
        requiredSpecialty: specialty as Specialty,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        hourlyRate: parseFloat(hourlyRate),
        urgency: urgency as ShiftUrgency,
      };
      if (description.trim()) body.description = description.trim();

      await createShift(body);
      Toast.show({ type: 'success', text1: 'Shift Posted!', text2: 'Your shift is now live.' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }, [validate, title, department, specialty, description, startTime, endTime, hourlyRate, urgency, createShift, navigation]);

  // ── Date picker handlers ───────────────────────────────────────────────
  const onStartChange = (_e: DateTimePickerEvent, date?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (date) {
      setStartTime(date);
      // Auto-adjust end time if needed
      if (date >= endTime) {
        setEndTime(new Date(date.getTime() + 2 * 60 * 60_000));
      }
    }
  };

  const onEndChange = (_e: DateTimePickerEvent, date?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (date) setEndTime(date);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={[Typography.h3, { color: Colors.text, flex: 1 }]}>Post New Shift</Text>
        </View>

        {/* ── Title ─────────────────────────────────────────────────────── */}
        <Input
          label="Shift Title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Night Shift MO"
          leftIcon="create-outline"
          error={errors.title}
          maxLength={200}
        />

        {/* ── Department ────────────────────────────────────────────────── */}
        <PickerModal
          label="Department"
          options={DEPARTMENT_OPTIONS}
          selectedValue={department}
          onSelect={setDepartment}
          leftIcon="grid-outline"
          error={errors.department}
        />

        {/* ── Specialty ─────────────────────────────────────────────────── */}
        <PickerModal
          label="Required Specialty"
          options={SPECIALTY_OPTIONS}
          selectedValue={specialty}
          onSelect={setSpecialty}
          leftIcon="medkit-outline"
          error={errors.specialty}
        />

        {/* ── Description ───────────────────────────────────────────────── */}
        <Input
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Enter shift details..."
          leftIcon="document-text-outline"
          multiline
          numberOfLines={4}
          maxLength={2000}
        />

        {/* ── Start Time ────────────────────────────────────────────────── */}
        <Text style={[Typography.bodySmallMedium, styles.label]}>Start Time</Text>
        <TouchableOpacity
          style={[styles.datePickerTrigger, errors.startTime ? { borderColor: Colors.error } : null]}
          onPress={() => setShowStartPicker(true)}
        >
          <Ionicons name="time-outline" size={20} color={Colors.textTertiary} />
          <Text style={[Typography.body, { color: Colors.text, marginLeft: 10, flex: 1 }]}>
            {startTime.toLocaleString()}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
        {errors.startTime && (
          <Text style={[Typography.caption, { color: Colors.error, marginTop: 4, marginBottom: Spacing.lg }]}>
            {errors.startTime}
          </Text>
        )}
        {showStartPicker && (
          <DateTimePicker
            value={startTime}
            mode="datetime"
            minimumDate={new Date()}
            onChange={onStartChange}
          />
        )}

        {/* ── End Time ──────────────────────────────────────────────────── */}
        <Text style={[Typography.bodySmallMedium, styles.label]}>End Time</Text>
        <TouchableOpacity
          style={[styles.datePickerTrigger, errors.endTime ? { borderColor: Colors.error } : null]}
          onPress={() => setShowEndPicker(true)}
        >
          <Ionicons name="time-outline" size={20} color={Colors.textTertiary} />
          <Text style={[Typography.body, { color: Colors.text, marginLeft: 10, flex: 1 }]}>
            {endTime.toLocaleString()}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
        {errors.endTime && (
          <Text style={[Typography.caption, { color: Colors.error, marginTop: 4, marginBottom: Spacing.lg }]}>
            {errors.endTime}
          </Text>
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endTime}
            mode="datetime"
            minimumDate={new Date(startTime.getTime() + 2 * 60 * 60_000)}
            onChange={onEndChange}
          />
        )}

        {/* ── Hourly Rate ───────────────────────────────────────────────── */}
        <Input
          label="Hourly Rate (PKR)"
          value={hourlyRate}
          onChangeText={setHourlyRate}
          placeholder="e.g. 1500"
          leftIcon="cash-outline"
          keyboardType="numeric"
          error={errors.hourlyRate}
        />

        {/* ── Urgency toggle ────────────────────────────────────────────── */}
        <Text style={[Typography.bodySmallMedium, styles.label]}>Urgency</Text>
        <View style={styles.urgencyRow}>
          <TouchableOpacity
            style={[styles.urgencyOption, urgency === 'NORMAL' && styles.urgencyOptionActive]}
            onPress={() => setUrgency('NORMAL')}
          >
            <Ionicons
              name="ellipse"
              size={14}
              color={urgency === 'NORMAL' ? Colors.primary : Colors.textTertiary}
            />
            <Text
              style={[
                Typography.bodySmallMedium,
                { color: urgency === 'NORMAL' ? Colors.primary : Colors.textSecondary, marginLeft: 6 },
              ]}
            >
              Normal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.urgencyOption, urgency === 'URGENT' && styles.urgencyOptionUrgent]}
            onPress={() => setUrgency('URGENT')}
          >
            <Ionicons
              name="flash"
              size={14}
              color={urgency === 'URGENT' ? Colors.urgent : Colors.textTertiary}
            />
            <Text
              style={[
                Typography.bodySmallMedium,
                { color: urgency === 'URGENT' ? Colors.urgent : Colors.textSecondary, marginLeft: 6 },
              ]}
            >
              Urgent
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Preview card ──────────────────────────────────────────────── */}
        {preview.totalPay > 0 && (
          <View style={styles.previewCard}>
            <Text style={[Typography.bodySmallSemiBold, { color: Colors.text, marginBottom: Spacing.sm }]}>
              Preview
            </Text>
            <View style={styles.previewRow}>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>Duration</Text>
              <Text style={[Typography.bodySmallSemiBold, { color: Colors.text }]}>
                {formatDuration(preview.duration)}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                Total Estimated Pay
              </Text>
              <Text style={[Typography.bodySemiBold, { color: Colors.primary }]}>
                {formatPKR(preview.totalPay)}
              </Text>
            </View>
          </View>
        )}

        {/* ── Submit button ─────────────────────────────────────────────── */}
        <View style={{ marginTop: Spacing.xl }}>
          <Button
            label="Post Shift"
            onPress={handleSubmit}
            loading={submitting}
            fullWidth
            leftIcon="checkmark-circle-outline"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl + 30,
    paddingBottom: Spacing.xxxxl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  backBtn: {
    marginRight: Spacing.md,
  },
  label: {
    color: Colors.text,
    marginBottom: Spacing.xs + 2,
    marginTop: Spacing.sm,
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    marginBottom: Spacing.lg,
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  urgencyOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  urgencyOptionUrgent: {
    borderColor: Colors.urgent,
    backgroundColor: Colors.urgentLight,
  },
  previewCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
  },
});
