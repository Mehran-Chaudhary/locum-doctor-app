import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';

import HospitalProfileViewScreen from './HospitalProfileViewScreen';
import HospitalReviewsListScreen from './HospitalReviewsListScreen';
import MyShiftsScreen from './MyShiftsScreen';
import CreateShiftScreen from './CreateShiftScreen';
import ShiftApplicantsScreen from './ShiftApplicantsScreen';
import HospitalShiftDetailScreen from './HospitalShiftDetailScreen';
import HospitalTimesheetsScreen from './HospitalTimesheetsScreen';
import HospitalTimesheetDetailScreen from './HospitalTimesheetDetailScreen';
import HospitalBillingScreen from './HospitalBillingScreen';
import SubmitReviewScreen from '../shared/SubmitReviewScreen';

const Tab = createBottomTabNavigator();
const ShiftsStack = createNativeStackNavigator();
const TimesheetsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// ── My Shifts Stack (List → Create / Applicants / Detail) ────────────────────
function ShiftsStackNavigator() {
  return (
    <ShiftsStack.Navigator screenOptions={{ headerShown: false }}>
      <ShiftsStack.Screen name="MyShiftsList" component={MyShiftsScreen} />
      <ShiftsStack.Screen name="CreateShift" component={CreateShiftScreen} />
      <ShiftsStack.Screen name="ShiftApplicants" component={ShiftApplicantsScreen} />
      <ShiftsStack.Screen name="HospitalShiftDetail" component={HospitalShiftDetailScreen} />
    </ShiftsStack.Navigator>
  );
}

// ── Timesheets Stack (List → Detail with approve/dispute → SubmitReview) ──────
function TimesheetsStackNavigator() {
  return (
    <TimesheetsStack.Navigator screenOptions={{ headerShown: false }}>
      <TimesheetsStack.Screen name="TimesheetsList" component={HospitalTimesheetsScreen} />
      <TimesheetsStack.Screen name="HospitalTimesheetDetail" component={HospitalTimesheetDetailScreen} />
      <TimesheetsStack.Screen name="SubmitReview" component={SubmitReviewScreen} />
    </TimesheetsStack.Navigator>
  );
}

// ── Profile Stack (Profile → Reviews List) ────────────────────────────────────
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="HospitalProfileView" component={HospitalProfileViewScreen} />
      <ProfileStack.Screen name="HospitalReviewsList" component={HospitalReviewsListScreen} />
    </ProfileStack.Navigator>
  );
}

export default function HospitalTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.hospital,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: { ...Typography.caption, marginTop: -2 },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
          paddingBottom: 4,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            'My Shifts': 'calendar-outline',
            Timesheets: 'time-outline',
            Billing: 'receipt-outline',
            Profile: 'business-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="My Shifts" component={ShiftsStackNavigator} />
      <Tab.Screen name="Timesheets" component={TimesheetsStackNavigator} />
      <Tab.Screen name="Billing" component={HospitalBillingScreen} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
