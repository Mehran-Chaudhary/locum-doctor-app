import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';

import PlaceholderScreen from '../shared/PlaceholderScreen';

const Tab = createBottomTabNavigator();

const DashboardPlaceholder = () => (
  <PlaceholderScreen title="Dashboard" icon="grid-outline" subtitle="Admin dashboard overview." />
);
const UsersPlaceholder = () => (
  <PlaceholderScreen title="Users" icon="people-outline" subtitle="Manage and verify user accounts." />
);
const DisputesPlaceholder = () => (
  <PlaceholderScreen title="Disputes" icon="flag-outline" subtitle="Resolve timesheet disputes." />
);
const ReviewsPlaceholder = () => (
  <PlaceholderScreen title="Reviews" icon="star-outline" subtitle="Moderate platform reviews." />
);

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.admin,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: { ...Typography.caption, marginTop: -2 },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
          paddingBottom: 4,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Dashboard: 'grid-outline',
            Users: 'people-outline',
            Disputes: 'flag-outline',
            Reviews: 'star-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardPlaceholder} />
      <Tab.Screen name="Users" component={UsersPlaceholder} />
      <Tab.Screen name="Disputes" component={DisputesPlaceholder} />
      <Tab.Screen name="Reviews" component={ReviewsPlaceholder} />
    </Tab.Navigator>
  );
}
