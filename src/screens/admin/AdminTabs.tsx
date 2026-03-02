import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';

import AdminDashboardScreen from './AdminDashboardScreen';
import AdminVerificationsScreen from './AdminVerificationsScreen';
import AdminUsersScreen from './AdminUsersScreen';
import AdminUserDetailScreen from './AdminUserDetailScreen';
import AdminShiftsScreen from './AdminShiftsScreen';
import AdminDisputesScreen from './AdminDisputesScreen';
import AdminDisputeResolveScreen from './AdminDisputeResolveScreen';
import AdminRevenueScreen from './AdminRevenueScreen';
import AdminReviewsScreen from './AdminReviewsScreen';

const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();
const UsersStack = createNativeStackNavigator();
const DisputesStack = createNativeStackNavigator();
const ReviewsStack = createNativeStackNavigator();

// ── Dashboard Stack (Dashboard → Verifications / Shifts / Revenue / UserDetail) ──
function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <DashboardStack.Screen name="AdminVerifications" component={AdminVerificationsScreen} />
      <DashboardStack.Screen name="AdminShifts" component={AdminShiftsScreen} />
      <DashboardStack.Screen name="AdminRevenue" component={AdminRevenueScreen} />
      <DashboardStack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
    </DashboardStack.Navigator>
  );
}

// ── Users Stack (List → Detail) ──────────────────────────────────────────────
function UsersStackNavigator() {
  return (
    <UsersStack.Navigator screenOptions={{ headerShown: false }}>
      <UsersStack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <UsersStack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
    </UsersStack.Navigator>
  );
}

// ── Disputes Stack (List → Resolve) ──────────────────────────────────────────
function DisputesStackNavigator() {
  return (
    <DisputesStack.Navigator screenOptions={{ headerShown: false }}>
      <DisputesStack.Screen name="AdminDisputes" component={AdminDisputesScreen} />
      <DisputesStack.Screen name="AdminDisputeResolve" component={AdminDisputeResolveScreen} />
    </DisputesStack.Navigator>
  );
}

// ── Reviews Stack ────────────────────────────────────────────────────────────
function ReviewsStackNavigator() {
  return (
    <ReviewsStack.Navigator screenOptions={{ headerShown: false }}>
      <ReviewsStack.Screen name="AdminReviews" component={AdminReviewsScreen} />
    </ReviewsStack.Navigator>
  );
}

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
      <Tab.Screen name="Dashboard" component={DashboardStackNavigator} />
      <Tab.Screen name="Users" component={UsersStackNavigator} />
      <Tab.Screen name="Disputes" component={DisputesStackNavigator} />
      <Tab.Screen name="Reviews" component={ReviewsStackNavigator} />
    </Tab.Navigator>
  );
}
