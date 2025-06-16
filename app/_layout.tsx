// app/_layout.tsx
import React from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { NotificationComponent } from '@/components/NotificationComponent';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WebSocketProvider>
          <View style={{ flex: 1 }}>
            <Slot />
            <NotificationComponent />
          </View>
        </WebSocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}