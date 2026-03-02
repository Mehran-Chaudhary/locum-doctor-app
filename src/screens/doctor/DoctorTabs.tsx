import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';

import PlaceholderScreen from '../shared/PlaceholderScreen';
import DoctorProfileViewScreen from './DoctorProfileViewScreen';
import ShiftFeedScreen from './ShiftFeedScreen';
import ShiftDetailScreen from './ShiftDetailScreen';
import MyApplicationsScreen from './MyApplicationsScreen';
import DoctorTimesheetsScreen from './DoctorTimesheetsScreen';
import TimesheetDetailScreen from './TimesheetDetailScreen';

const Tab = createBottomTabNavigator();
const ShiftsStack = createNativeStackNavigator();
const AppsStack = createNativeStackNavigator();
const TimesheetsStack = createNativeStackNavigator();

// ── Shifts Stack (Feed → Detail) ─────────────────────────────────────────────
function ShiftsStackNavigator() {
  return (
    <ShiftsStack.Navigator screenOptions={{ headerShown: false }}>
      <ShiftsStack.Screen name="ShiftFeed" component={ShiftFeedScreen} />
      <ShiftsStack.Screen name="ShiftDetail" component={ShiftDetailScreen} />
    </ShiftsStack.Navigator>
  );
}

// ── Applications Stack (List → Shift Detail) ─────────────────────────────────
function ApplicationsStackNavigator() {
  return (
    <AppsStack.Navigator screenOptions={{ headerShown: false }}>
      <AppsStack.Screen name="MyApplications" component={MyApplicationsScreen} />
      <AppsStack.Screen name="ShiftDetail" component={ShiftDetailScreen} />
    </AppsStack.Navigator>
  );
}

// ── Timesheets Stack (List → Detail with clock-in/out) ────────────────────────
function TimesheetsStackNavigator() {
  return (
    <TimesheetsStack.Navigator screenOptions={{ headerShown: false }}>
      <TimesheetsStack.Screen name="TimesheetsList" component={DoctorTimesheetsScreen} />
      <TimesheetsStack.Screen name="TimesheetDetail" component={TimesheetDetailScreen} />
    </TimesheetsStack.Navigator>
  );
}

const WalletPlaceholder = () => (
  <PlaceholderScreen title="Wallet" icon="wallet-outline" subtitle="View your earnings and payment history." />
);

export default function DoctorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.doctor,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: { ...Typography.caption, marginTop: -2 },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
          paddingBottom: 4,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Shifts: 'briefcase-outline',
            Applications: 'paper-plane-outline',
            Timesheets: 'time-outline',
            Wallet: 'wallet-outline',
            Profile: 'person-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Shifts" component={ShiftsStackNavigator} />
      <Tab.Screen name="Applications" component={ApplicationsStackNavigator} />
      <Tab.Screen name="Timesheets" component={TimesheetsStackNavigator} />
      <Tab.Screen name="Wallet" component={WalletPlaceholder} />
      <Tab.Screen name="Profile" component={DoctorProfileViewScreen} />
    </Tab.Navigator>
  );
}
