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
import PickerModal from '../../components/ui/PickerModal';
import ImagePickerButton from '../../components/ui/ImagePickerButton';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { useAuthStore } from '../../stores/auth.store';
import { doctorService } from '../../services/doctor.service';
import { uploadService } from '../../services/upload.service';
import { getCurrentLocation, formatCoords } from '../../utils/location';
import { getErrorMessage } from '../../utils/error';
import { SPECIALTY_OPTIONS, UploadType } from '../../constants/enums';
import { Colors, Typography, Spacing, Layout, BorderRadius, Shadows } from '../../constants/theme';

// ─── Validation ───────────────────────────────────────────────────────────────
const schema = z.object({
  firstName: z.string().min(1, 'Required').max(50),
  lastName: z.string().min(1, 'Required').max(50),
  city: z.string().min(1, 'Required'),
  pmdcNumber: z.string().min(1, 'Required'),
  specialty: z.string().min(1, 'Select a specialty'),
  yearsExperience: z.string().min(1, 'Required').refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid number'),
  hourlyRate: z.string().min(1, 'Required').refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid rate'),
  bio: z.string().max(500).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DoctorProfileScreen() {
  const { user, refreshUser } = useAuthStore();
  const isEditMode = !!user?.doctorProfile;
  const profile = user?.doctorProfile;

  const [profilePic, setProfilePic] = useState<ImagePickerTypes.ImagePickerAsset | null>(null);
  const [pmdcCert, setPmdcCert] = useState<ImagePickerTypes.ImagePickerAsset | null>(null);
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
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      city: profile?.city ?? '',
      pmdcNumber: profile?.pmdcNumber ?? '',
      specialty: profile?.specialty ?? '',
      yearsExperience: profile?.yearsExperience?.toString() ?? '',
      hourlyRate: profile?.hourlyRate?.toString() ?? '',
      bio: profile?.bio ?? '',
    },
  });

  // ── Location ──────────────────────────────────────────────────────────────
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

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        city: values.city,
        pmdcNumber: values.pmdcNumber,
        specialty: values.specialty as any,
        yearsExperience: parseInt(values.yearsExperience, 10),
        hourlyRate: parseFloat(values.hourlyRate),
        bio: values.bio || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      };

      if (isEditMode) {
        await doctorService.updateProfile(payload);
      } else {
        await doctorService.createProfile(payload);
      }

      if (profilePic) {
        await uploadService.upload(
          UploadType.PROFILE_PIC,
          profilePic.uri,
          profilePic.mimeType || 'image/jpeg',
          profilePic.fileName || 'profile.jpg',
        );
      }
      if (pmdcCert) {
        await uploadService.upload(
          UploadType.PMDC_CERT,
          pmdcCert.uri,
          pmdcCert.mimeType || 'image/jpeg',
          pmdcCert.fileName || 'pmdc.jpg',
        );
      }

      await refreshUser();
      Toast.show({ type: 'success', text1: isEditMode ? 'Profile Updated' : 'Profile Created', text2: isEditMode ? 'Your profile has been updated.' : 'Your profile is now under review.' });
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
          colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
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
                  {isEditMode ? 'Edit Profile' : 'Complete Your Profile'}
                </Text>
                <Text style={[Typography.bodySmall, styles.headerSubtitle]}>
                  {isEditMode ? 'Update your doctor profile details' : 'Help hospitals find you'}
                </Text>
              </View>
              {/* Step indicator */}
              <View style={styles.stepBadge}>
                <Ionicons name="medical" size={18} color={Colors.textInverse} />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Profile Photo ────────────────────────────────────────────── */}
          <View style={styles.photoSection}>
            <ImagePickerButton
              imageUri={profilePic?.uri ?? profile?.profilePicUrl ?? null}
              onImagePicked={setProfilePic}
              onClear={() => setProfilePic(null)}
              shape="circle"
              size={110}
              icon="camera-outline"
              label="Add Photo"
            />
          </View>

          {/* ── Section: Personal Information ────────────────────────────── */}
          <View style={[styles.sectionCard, Shadows.md]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: Colors.primarySoft }]}>
                <Ionicons name="person-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={[Typography.h4, styles.sectionTitle]}>Personal Information</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, value } }) => (
                    <Input label="First Name" value={value} onChangeText={onChange} error={errors.firstName?.message} placeholder="John" />
                  )}
                />
              </View>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Last Name" value={value} onChangeText={onChange} error={errors.lastName?.message} placeholder="Doe" />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, value } }) => (
                <Input label="City" value={value} onChangeText={onChange} error={errors.city?.message} leftIcon="location-outline" placeholder="Lahore" />
              )}
            />
          </View>

          {/* ── Section: Professional Details ────────────────────────────── */}
          <View style={[styles.sectionCard, Shadows.md]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="medkit-outline" size={18} color="#D97706" />
              </View>
              <Text style={[Typography.h4, styles.sectionTitle]}>Professional Details</Text>
            </View>

            <Controller
              control={control}
              name="pmdcNumber"
              render={({ field: { onChange, value } }) => (
                <Input label="PMDC Registration Number" value={value} onChangeText={onChange} error={errors.pmdcNumber?.message} leftIcon="id-card-outline" placeholder="12345-P" />
              )}
            />

            <Controller
              control={control}
              name="specialty"
              render={({ field: { onChange, value } }) => (
                <PickerModal
                  label="Specialty"
                  options={SPECIALTY_OPTIONS}
                  selectedValue={value}
                  onSelect={onChange}
                  error={errors.specialty?.message}
                  leftIcon="medical-outline"
                  placeholder="Select your specialty"
                />
              )}
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="yearsExperience"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Years of Experience" value={value} onChangeText={onChange} error={errors.yearsExperience?.message} keyboardType="numeric" placeholder="5" />
                  )}
                />
              </View>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="hourlyRate"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Hourly Rate (PKR)" value={value} onChangeText={onChange} error={errors.hourlyRate?.message} keyboardType="numeric" leftIcon="cash-outline" placeholder="2500" />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="bio"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Bio (Optional)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.bio?.message}
                  multiline
                  numberOfLines={4}
                  placeholder="Brief description of your experience..."
                  maxLength={500}
                />
              )}
            />
          </View>

          {/* ── Section: Location ────────────────────────────────────────── */}
          <View style={[styles.sectionCard, Shadows.md]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="navigate-outline" size={18} color="#2563EB" />
              </View>
              <Text style={[Typography.h4, styles.sectionTitle]}>Location</Text>
            </View>

            <Button
              label={locatingGps ? 'Detecting...' : 'Detect My Location'}
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

          {/* ── Section: PMDC Certificate ────────────────────────────────── */}
          <View style={[styles.sectionCard, Shadows.md]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="document-text-outline" size={18} color="#7C3AED" />
              </View>
              <Text style={[Typography.h4, styles.sectionTitle]}>PMDC Certificate</Text>
            </View>

            <ImagePickerButton
              imageUri={pmdcCert?.uri ?? profile?.pmdcCertUrl ?? null}
              onImagePicked={setPmdcCert}
              onClear={() => setPmdcCert(null)}
              shape="rect"
              size={160}
              icon="document-outline"
              label="Upload Certificate"
              aspect={[4, 3]}
            />
          </View>

          {/* ── Submit ───────────────────────────────────────────────────── */}
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
    backgroundColor: Colors.decorativeCircle,
    top: -40,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.decorativeCircleLight,
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
  headerSubtitle: { color: Colors.textOnGradient },
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
  photoSection: {
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
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
