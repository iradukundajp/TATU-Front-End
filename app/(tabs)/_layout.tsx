import { Stack } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { HamburgerMenu } from '@/components/HamburgerMenu';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isArtist } = useAuth();

  return (
    <View style={styles.container}>
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
