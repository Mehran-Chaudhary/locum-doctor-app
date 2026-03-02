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
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
import { Colors } from '../../constants/theme';

const PAD = 16;

// ─── Validation ───────────────────────────────────────────────────────────────
const schema = z.object({
  firstName: z.string().min(1, 'Required').max(50),
  lastName: z.string().min(1, 'Required').max(50),
  city: z.string().min(1, 'Required'),
  pmdcNumber: z.string().min(1, 'Required'),
  specialty: z.string().min(1, 'Select a specialty'),
  yearsExperience: z
    .string()
    .min(1, 'Required')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid number'),
  hourlyRate: z
    .string()
    .min(1, 'Required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid rate'),
  bio: z.string().max(500).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  iconBg,
  iconColor,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconBg, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function EditDoctorProfileScreen() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuthStore();
  const profile = user?.doctorProfile;

  const [profilePic, setProfilePic] = useState<ImagePickerTypes.ImagePickerAsset | null>(null);
  const [pmdcCert, setPmdcCert] = useState<ImagePickerTypes.ImagePickerAsset | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    profile?.latitude && profile?.longitude
      ? { latitude: profile.latitude, longitude: profile.longitude }
      : null,
  );
  const [locatingGps, setLocatingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
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
      Toast.show({
        type: 'success',
        text1: 'Location Captured',
        text2: formatCoords(location.latitude, location.longitude),
      });
    } else {
      Alert.alert('Permission Denied', 'Enable location permissions in device settings.');
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

      await doctorService.updateProfile(payload);

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
      Toast.show({ type: 'success', text1: 'Profile Updated', text2: 'Your changes have been saved.' });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <LoadingOverlay visible={submitting} message="Saving profile…" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ═══════════════════ Gradient Header ═══════════════════════════ */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.decoBlob1} />
          <View style={styles.decoBlob2} />

          <SafeAreaView edges={['top']} style={{ zIndex: 2 }}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backBtn}
                activeOpacity={0.7}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={18} color="#FFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <Text style={styles.headerSubtitle}>Update your details below</Text>
              </View>
              <View style={styles.headerBadge}>
                <Ionicons name="medical" size={18} color="#FFF" />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ═══════════════════ Profile Photo ═══════════════════════════ */}
          <View style={styles.photoSection}>
            <ImagePickerButton
              imageUri={profilePic?.uri ?? profile?.profilePicUrl ?? null}
              onImagePicked={setProfilePic}
              onClear={() => setProfilePic(null)}
              shape="circle"
              size={100}
              icon="camera-outline"
              label="Change Photo"
            />
            <Text style={styles.photoHint}>Tap to change your photo</Text>
          </View>

          {/* ═══════════════════ Personal Info ═══════════════════════════ */}
          <View style={styles.card}>
            <SectionHeader
              icon="person-outline"
              iconBg={Colors.primaryLight}
              iconColor={Colors.primary}
              title="Personal Information"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="First Name"
                      value={value}
                      onChangeText={onChange}
                      error={errors.firstName?.message}
                      placeholder="John"
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Last Name"
                      value={value}
                      onChangeText={onChange}
                      error={errors.lastName?.message}
                      placeholder="Doe"
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="City"
                  value={value}
                  onChangeText={onChange}
                  error={errors.city?.message}
                  leftIcon="location-outline"
                  placeholder="Lahore"
                />
              )}
            />
          </View>

          {/* ═══════════════════ Professional Details ════════════════════ */}
          <View style={styles.card}>
            <SectionHeader
              icon="medkit-outline"
              iconBg="#FEF3C7"
              iconColor="#D97706"
              title="Professional Details"
            />

            <Controller
              control={control}
              name="pmdcNumber"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="PMDC Registration #"
                  value={value}
                  onChangeText={onChange}
                  error={errors.pmdcNumber?.message}
                  leftIcon="id-card-outline"
                  placeholder="12345-P"
                />
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
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="yearsExperience"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Years of Exp."
                      value={value}
                      onChangeText={onChange}
                      error={errors.yearsExperience?.message}
                      keyboardType="numeric"
                      placeholder="5"
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="hourlyRate"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Hourly Rate (PKR)"
                      value={value}
                      onChangeText={onChange}
                      error={errors.hourlyRate?.message}
                      keyboardType="numeric"
                      leftIcon="cash-outline"
                      placeholder="2500"
                    />
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
                  placeholder="Brief description of your experience…"
                  maxLength={500}
                />
              )}
            />
          </View>

          {/* ═══════════════════ Location ════════════════════════════════ */}
          <View style={styles.card}>
            <SectionHeader
              icon="navigate-outline"
              iconBg="#DBEAFE"
              iconColor="#2563EB"
              title="Location"
            />

            <Button
              label={locatingGps ? 'Detecting…' : 'Detect My Location'}
              onPress={handleGetLocation}
              variant="outline"
              size="md"
              leftIcon="navigate-outline"
              loading={locatingGps}
              fullWidth
            />

            {coords && (
              <View style={styles.coordsBadge}>
                <View style={styles.coordsDot} />
                <Text style={styles.coordsText}>
                  {formatCoords(coords.latitude, coords.longitude)}
                </Text>
              </View>
            )}
          </View>

          {/* ═══════════════════ PMDC Certificate ═══════════════════════ */}
          <View style={styles.card}>
            <SectionHeader
              icon="document-text-outline"
              iconBg="#F5F3FF"
              iconColor="#7C3AED"
              title="PMDC Certificate"
            />

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

          {/* ═══════════════════ Save Button ═════════════════════════════ */}
          <TouchableOpacity
            style={styles.saveBtn}
            activeOpacity={0.8}
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
          >
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  /* ── Gradient header ─────────────────────────────────────────────────────── */
  headerGradient: {
    overflow: 'hidden',
    position: 'relative',
  },
  decoBlob1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -40,
    right: -30,
  },
  decoBlob2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 10,
    left: -20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingTop: 8,
    paddingBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Scroll content ──────────────────────────────────────────────────────── */
  scrollContent: {
    paddingHorizontal: PAD,
    paddingTop: 20,
    paddingBottom: 40,
  },

  /* ── Photo ────────────────────────────────────────────────────────────────── */
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoHint: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textTertiary,
    marginTop: 8,
  },

  /* ── Cards ────────────────────────────────────────────────────────────────── */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: PAD,
    marginBottom: 14,
  },

  /* ── Section header ──────────────────────────────────────────────────────── */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },

  /* ── Row ──────────────────────────────────────────────────────────────────── */
  row: {
    flexDirection: 'row',
    gap: 12,
  },

  /* ── Location badge ──────────────────────────────────────────────────────── */
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.successLight,
    borderRadius: 8,
  },
  coordsDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 8,
  },
  coordsText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },

  /* ── Save button ─────────────────────────────────────────────────────────── */
  saveBtn: {
    marginTop: 4,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.2,
  },
});
