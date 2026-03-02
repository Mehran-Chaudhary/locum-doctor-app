import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import type * as ImagePickerTypes from 'expo-image-picker';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ImagePickerButton from '../../components/ui/ImagePickerButton';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { useAuthStore } from '../../stores/auth.store';
import { hospitalService } from '../../services/hospital.service';
import { uploadService } from '../../services/upload.service';
import { getCurrentLocation, formatCoords } from '../../utils/location';
import { getErrorMessage } from '../../utils/error';
import { UploadType } from '../../constants/enums';
import { Colors, Typography, Spacing, Layout } from '../../constants/theme';

// ─── Validation ───────────────────────────────────────────────────────────────
const schema = z.object({
  hospitalName: z.string().min(1, 'Required').max(100),
  address: z.string().min(1, 'Required'),
  city: z.string().min(1, 'Required'),
  healthCommRegNumber: z.string().min(1, 'Required'),
  contactPersonName: z.string().min(1, 'Required'),
  contactPersonPhone: z
    .string()
    .min(1, 'Required')
    .regex(/^\+923\d{9}$/, 'Format: +923XXXXXXXXX'),
  contactPersonEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HospitalProfileScreen() {
  const { user, refreshUser } = useAuthStore();
  const isEditMode = !!user?.hospitalProfile;
  const profile = user?.hospitalProfile;

  const [logo, setLogo] = useState<ImagePickerTypes.ImagePickerAsset | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    profile?.latitude && profile?.longitude
      ? { latitude: profile.latitude, longitude: profile.longitude }
      : null
  );
  const [locatingGps, setLocatingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hospitalName: profile?.hospitalName ?? '',
      address: profile?.address ?? '',
      city: profile?.city ?? '',
      healthCommRegNumber: profile?.healthCommRegNumber ?? '',
      contactPersonName: profile?.contactPersonName ?? '',
      contactPersonPhone: profile?.contactPersonPhone ?? '+92',
      contactPersonEmail: profile?.contactPersonEmail ?? '',
    },
  });

  const handleGetLocation = async () => {
    setLocatingGps(true);
    const location = await getCurrentLocation();
    setLocatingGps(false);
    if (location) {
      setCoords(location);
      Toast.show({ type: 'success', text1: 'Location Captured', text2: formatCoords(location.latitude, location.longitude) });
    } else {
      Alert.alert('Permission Denied', 'Please enable location permissions in your device settings.');
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        hospitalName: values.hospitalName,
        address: values.address,
        city: values.city,
        healthCommRegNumber: values.healthCommRegNumber,
        contactPersonName: values.contactPersonName,
        contactPersonPhone: values.contactPersonPhone,
        contactPersonEmail: values.contactPersonEmail || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      };

      if (isEditMode) {
        await hospitalService.updateProfile(payload);
      } else {
        await hospitalService.createProfile(payload);
      }

      if (logo) {
        await uploadService.upload(
          UploadType.HOSPITAL_LOGO,
          logo.uri,
          logo.mimeType || 'image/jpeg',
          logo.fileName || 'logo.jpg',
        );
      }

      await refreshUser();
      Toast.show({ type: 'success', text1: isEditMode ? 'Profile Updated' : 'Profile Created', text2: isEditMode ? 'Your hospital profile has been updated.' : 'Your hospital profile is now under review.' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LoadingOverlay visible={submitting} message="Saving profile..." />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text style={[Typography.h2, styles.heading]}>
            {isEditMode ? 'Edit Hospital Profile' : 'Hospital Profile'}
          </Text>
          <Text style={[Typography.bodySmall, styles.subheading]}>
            {isEditMode ? 'Update your hospital details.' : 'Complete your hospital information to start posting shifts.'}
          </Text>

          {/* ── Logo ───────────────────────────────────────────────────── */}
          <ImagePickerButton
            imageUri={logo?.uri ?? profile?.logoUrl ?? null}
            onImagePicked={setLogo}
            onClear={() => setLogo(null)}
            shape="circle"
            size={110}
            icon="image-outline"
            label="Hospital Logo"
            style={{ marginBottom: Spacing.xxxl }}
          />

          {/* ── Section: Hospital Information ────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Ionicons name="business-outline" size={18} color={Colors.hospital} />
            <Text style={[Typography.bodySemiBold, styles.sectionTitle]}>Hospital Information</Text>
          </View>

          <Controller
            control={control}
            name="hospitalName"
            render={({ field: { onChange, value } }) => (
              <Input label="Hospital Name" value={value} onChangeText={onChange} error={errors.hospitalName?.message} leftIcon="business-outline" placeholder="City General Hospital" />
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, value } }) => (
              <Input label="Address" value={value} onChangeText={onChange} error={errors.address?.message} leftIcon="location-outline" placeholder="123 Main Street, Block A" />
            )}
          />

          <Controller
            control={control}
            name="city"
            render={({ field: { onChange, value } }) => (
              <Input label="City" value={value} onChangeText={onChange} error={errors.city?.message} leftIcon="map-outline" placeholder="Lahore" />
            )}
          />

          <Controller
            control={control}
            name="healthCommRegNumber"
            render={({ field: { onChange, value } }) => (
              <Input label="HC Registration Number" value={value} onChangeText={onChange} error={errors.healthCommRegNumber?.message} leftIcon="id-card-outline" placeholder="HC-12345" />
            )}
          />

          {/* ── Section: Contact Person ───────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={18} color={Colors.hospital} />
            <Text style={[Typography.bodySemiBold, styles.sectionTitle]}>Contact Person</Text>
          </View>

          <Controller
            control={control}
            name="contactPersonName"
            render={({ field: { onChange, value } }) => (
              <Input label="Full Name" value={value} onChangeText={onChange} error={errors.contactPersonName?.message} leftIcon="person-outline" placeholder="Dr. Ahmed Khan" />
            )}
          />

          <Controller
            control={control}
            name="contactPersonPhone"
            render={({ field: { onChange, value } }) => (
              <Input label="Phone Number" value={value} onChangeText={onChange} error={errors.contactPersonPhone?.message} leftIcon="call-outline" keyboardType="phone-pad" placeholder="+923001234567" maxLength={13} />
            )}
          />

          <Controller
            control={control}
            name="contactPersonEmail"
            render={({ field: { onChange, value } }) => (
              <Input label="Email (Optional)" value={value ?? ''} onChangeText={onChange} error={errors.contactPersonEmail?.message} leftIcon="mail-outline" keyboardType="email-address" autoCapitalize="none" placeholder="admin@hospital.com" />
            )}
          />

          {/* ── Section: Location ────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Ionicons name="navigate-outline" size={18} color={Colors.hospital} />
            <Text style={[Typography.bodySemiBold, styles.sectionTitle]}>Location</Text>
          </View>

          <Button
            label={locatingGps ? 'Detecting...' : 'Detect Hospital Location'}
            onPress={handleGetLocation}
            variant="outline"
            size="md"
            leftIcon="navigate-outline"
            loading={locatingGps}
            fullWidth
          />
          {coords && (
            <View style={styles.locationBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={[Typography.caption, { color: Colors.success, marginLeft: 6 }]}>
                Location captured: {formatCoords(coords.latitude, coords.longitude)}
              </Text>
            </View>
          )}

          {/* ── Submit ───────────────────────────────────────────────── */}
          <Button
            label={isEditMode ? 'Update Profile' : 'Complete Profile'}
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
            fullWidth
            style={{ marginTop: Spacing.xxxl, marginBottom: Spacing.xxl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxxl,
  },
  heading: { color: Colors.text, textAlign: 'center', marginBottom: Spacing.xs },
  subheading: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
});
