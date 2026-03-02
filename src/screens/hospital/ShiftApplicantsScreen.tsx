import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { useApplicationStore } from '../../stores/application.store';
import ApplicantCard from '../../components/shifts/ApplicantCard';
import { Colors, Typography, Spacing, Layout } from '../../constants/theme';
import { getErrorMessage } from '../../utils/error';
import type { ShiftApplication } from '../../types';

// ─── Route params ─────────────────────────────────────────────────────────────
type ApplicantsParams = {
  ShiftApplicants: { shiftId: string; shiftTitle: string };
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ShiftApplicantsScreen() {
  const route = useRoute<RouteProp<ApplicantsParams, 'ShiftApplicants'>>();
  const navigation = useNavigation();
  const { shiftId, shiftTitle } = route.params;

  const { applicantsData, applicantsLoading, loadApplicants, acceptApplication, mutating, clearApplicants } =
    useApplicationStore();

  useEffect(() => {
    loadApplicants(shiftId);
    return () => clearApplicants();
  }, [shiftId]);

  // ── Accept handler ─────────────────────────────────────────────────────
  const handleAccept = useCallback(
    (app: ShiftApplication) => {
      const doctorName = app.doctorProfile
        ? `Dr. ${app.doctorProfile.firstName} ${app.doctorProfile.lastName}`
        : 'this doctor';

      Alert.alert(
        'Accept Applicant',
        `Accept ${doctorName} for this shift? All other applicants will be automatically rejected.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Accept',
            onPress: async () => {
              try {
                await acceptApplication(app.id);
                Toast.show({
                  type: 'success',
                  text1: 'Doctor Accepted!',
                  text2: `${doctorName} has been accepted. Other applicants have been notified.`,
                });
              } catch (err) {
                Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) });
              }
            },
          },
        ],
      );
    },
    [acceptApplication],
  );

  // ── Render applicant ───────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: ShiftApplication }) => (
      <ApplicantCard
        application={item}
        onAccept={() => handleAccept(item)}
        accepting={mutating}
      />
    ),
    [handleAccept, mutating],
  );

  const renderEmpty = useCallback(() => {
    if (applicantsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={56} color={Colors.textTertiary} />
        <Text style={[Typography.h4, { color: Colors.text, marginTop: Spacing.lg }]}>
          No applicants yet
        </Text>
        <Text
          style={[
            Typography.bodySmall,
            { color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
          ]}
        >
          Doctors will appear here when they apply for this shift.
        </Text>
      </View>
    );
  }, [applicantsLoading]);

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={Colors.text}
          onPress={() => navigation.goBack()}
          style={{ marginRight: Spacing.md }}
        />
        <View style={{ flex: 1 }}>
          <Text style={[Typography.h4, { color: Colors.text }]} numberOfLines={1}>
            {shiftTitle}
          </Text>
          {applicantsData && (
            <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
              {applicantsData.totalApplicants} applicant
              {applicantsData.totalApplicants !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>

      {/* ── List ─────────────────────────────────────────────────────────── */}
      {applicantsLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={applicantsData?.applicants ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl + 30,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: {
    paddingTop: Spacing.xxxxl * 2,
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
});
