import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import RootNavigator from './src/navigation/RootNavigator';
import { toastConfig } from './src/components/ui/ToastConfig';
import { useAuthStore } from './src/stores/auth.store';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
      <Toast config={toastConfig} topOffset={54} />
    </SafeAreaProvider>
  );
}
