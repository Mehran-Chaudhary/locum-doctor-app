import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Colors, Typography, Spacing, Layout, BorderRadius, Shadows } from '../../constants/theme';

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LoadingOverlay visible={submitting} message="Saving profile..." />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={['#0E7490', '#0891B2', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <SafeAreaView edges={['top']} style={styles.headerSafe}>
            <View style={styles.headerContent}>
              <View>
                <Text style={[Typography.h2, styles.headerTitle]}>
                  {isEditMode ? 'Edit Hospital' : 'Hospital Profile'}
                </Text>
                <Text style={[Typography.bodySmall, styles.headerSubtitle]}>
                  {isEditMode ? 'Update your hospital details' : 'Start posting shifts for doctors'}
                </Text>
              </View>
              <View style={styles.stepBadge}>
                <Ionicons name="business" size={18} color={Colors.textInverse} />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ───────────────────────────────────────────────────── */}
          <View style={styles.logoSection}>
            <ImagePickerButton
              imageUri={logo?.uri ?? profile?.logoUrl ?? null}
              onImagePicked={setLogo}
              onClear={() => setLogo(null)}
              shape="circle"
              size={110}
              icon="image-outline"
              label="Hospital Logo"
            />
          </View>

          {/* ── Section: Hospital Information ────────────────────────────── */}
          <View style={[styles.sectionCard, Shadows.md]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#CFFAFE' }]}>
                <Ionicons name="business-outline" size={18} color="#0891B2" />
              </View>
              <Text style={[Typography.h4, styles.sectionTitle]}>Hospital Information</Text>
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
          </View>

          {/* ── Section: Contact Person ───────────────────────────────── */}
          <View style={[styles.sectionCard, Shadows.md]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="people-outline" size={18} color="#D97706" />
              </View>
              <Text style={[Typography.h4, styles.sectionTitle]}>Contact Person</Text>
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
          </View>

          {/* ── Section: Location ────────────────────────────────────── */}
          <View style={[styles.sectionCard, Shadows.md]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="navigate-outline" size={18} color="#2563EB" />
              </View>
              <Text style={[Typography.h4, styles.sectionTitle]}>Location</Text>
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
                <View style={styles.locationDot} />
                <Text style={[Typography.captionMedium, { color: Colors.success }]}>
                  Location captured: {formatCoords(coords.latitude, coords.longitude)}
                </Text>
              </View>
            )}
          </View>

          {/* ── Submit ───────────────────────────────────────────────── */}
          <Button
            label={isEditMode ? 'Update Profile' : 'Complete Profile'}
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
            fullWidth
            rightIcon="arrow-forward"
            style={{ marginTop: Spacing.sm, marginBottom: Spacing.xxxxl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  // Header
  headerGradient: {
    overflow: 'hidden',
    position: 'relative',
  },
  headerSafe: {},
  decorCircle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -40,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 10,
    left: -20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  headerTitle: { color: Colors.textInverse, marginBottom: Spacing.xs },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)' },
  stepBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Content
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxxl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  // Section cards
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  sectionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.sm,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: Spacing.sm,
  },
});
