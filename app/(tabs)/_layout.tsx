import { Tabs } from 'expo-router'; // Changed from Stack
import React from 'react';
// import { View, StyleSheet } from 'react-native'; // Removed
// import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Removed

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { HamburgerMenu } from '@/components/HamburgerMenu'; // Ensure HamburgerMenu is imported
import { Colors } from '@/constants/Colors'; // Import Colors for tint

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isArtist } = useAuth();
  // const insets = useSafeAreaInsets(); // Removed
  
  // Manual tabBarHeight calculation and global variable removed
  // console.log('Tab bar height calculated:', tabBarHeight);

  return (
    // <View style={[styles.container, { paddingBottom: insets.bottom }]}> // View wrapper removed
      
      <Tabs // Changed from Stack
        screenOptions={{
          headerShown: true, // Ensure header is shown to display the hamburger menu
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerLeft: () => <HamburgerMenu />, // Add HamburgerMenu to the left of the header
        }}
      >
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="tattoos" />
        <Tabs.Screen name="bookings" />
        {isArtist && <Tabs.Screen name="portfolio" />}
        {isArtist && <Tabs.Screen name="manage-bookings" />}
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="messages" />
      </Tabs>
    // </View> // View wrapper removed
  );
}

// StyleSheet removed as the View wrapper is gone
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
// });
