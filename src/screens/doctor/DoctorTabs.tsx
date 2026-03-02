import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';

import PlaceholderScreen from '../shared/PlaceholderScreen';
import DoctorProfileViewScreen from './DoctorProfileViewScreen';

const Tab = createBottomTabNavigator();

const ShiftsPlaceholder = () => (
  <PlaceholderScreen title="Shift Feed" icon="briefcase-outline" subtitle="Browse available locum shifts near you." />
);
const ApplicationsPlaceholder = () => (
  <PlaceholderScreen title="My Applications" icon="paper-plane-outline" subtitle="Track your shift applications." />
);
const TimesheetsPlaceholder = () => (
  <PlaceholderScreen title="Timesheets" icon="time-outline" subtitle="View your shift timesheets and hours." />
);
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
      <Tab.Screen name="Shifts" component={ShiftsPlaceholder} />
      <Tab.Screen name="Applications" component={ApplicationsPlaceholder} />
      <Tab.Screen name="Timesheets" component={TimesheetsPlaceholder} />
      <Tab.Screen name="Wallet" component={WalletPlaceholder} />
      <Tab.Screen name="Profile" component={DoctorProfileViewScreen} />
    </Tab.Navigator>
  );
}
