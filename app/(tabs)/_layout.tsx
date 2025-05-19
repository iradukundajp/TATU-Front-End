import { Tabs } from 'expo-router'; // Changed from Stack
import React from 'react';
// import { View, StyleSheet } from 'react-native'; // View and StyleSheet might not be needed directly here anymore

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
// import { HamburgerMenu } from '@/components/HamburgerMenu'; // Removed for now

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isArtist } = useAuth();

  return (
    // <View style={styles.container}> // Removed View wrapper
      /* Hamburger menu for navigation */
      // <HamburgerMenu /> // Removed HamburgerMenu
      
      /* Tabs navigator */ // Changed comment
      <Tabs // Changed from Stack
        screenOptions={{
          headerShown: true, // Default for Tabs, can be configured per screen
          // Add other tab-specific screenOptions here if needed
          // e.g., tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
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
    // </View> // Removed View wrapper
  );
}

/* // StyleSheet might not be needed if View is removed
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
*/
