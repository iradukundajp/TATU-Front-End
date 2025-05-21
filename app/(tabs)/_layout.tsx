import { Stack } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { HamburgerMenu } from '@/components/HamburgerMenu';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isArtist } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Calculate tab bar height including safe area insets
  const tabBarHeight = 50 + insets.bottom; // 50 is a base height, adjust if needed
  
  // Set a global variable to store the tab bar height that other components can access
  if (global && typeof global === 'object') {
    (global as any).tabBarHeight = tabBarHeight;
  }
  
  // Log the calculated height
  console.log('Tab bar height calculated:', tabBarHeight);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Hamburger menu for navigation */}
      <HamburgerMenu />
      
      {/* Stack navigator without visible header */}
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="explore" />
        <Stack.Screen name="tattoos" />
        <Stack.Screen name="bookings" />
        {isArtist && <Stack.Screen name="portfolio" />}
        {isArtist && <Stack.Screen name="manage-bookings" />}
        <Stack.Screen name="profile" />
        <Stack.Screen name="messages" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});