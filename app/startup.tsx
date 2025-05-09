import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function StartupScreen() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to login after a short delay
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TATU</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
  },
});
