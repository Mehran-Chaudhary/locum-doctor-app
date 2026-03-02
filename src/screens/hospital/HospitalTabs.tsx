import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';

import PlaceholderScreen from '../shared/PlaceholderScreen';
import HospitalProfileViewScreen from './HospitalProfileViewScreen';

const Tab = createBottomTabNavigator();

const MyShiftsPlaceholder = () => (
  <PlaceholderScreen title="My Shifts" icon="calendar-outline" subtitle="Manage your posted shifts." />
);
const TimesheetsPlaceholder = () => (
  <PlaceholderScreen title="Timesheets" icon="time-outline" subtitle="Approve doctor timesheets." />
);
const BillingPlaceholder = () => (
  <PlaceholderScreen title="Billing" icon="receipt-outline" subtitle="View invoices and payment details." />
);

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
      <Tab.Screen name="My Shifts" component={MyShiftsPlaceholder} />
      <Tab.Screen name="Timesheets" component={TimesheetsPlaceholder} />
      <Tab.Screen name="Billing" component={BillingPlaceholder} />
      <Tab.Screen name="Profile" component={HospitalProfileViewScreen} />
    </Tab.Navigator>
  );
}
