import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';

export default function StartupScreen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Only navigate after authentication state is determined
    if (!loading) {
      const destination = isAuthenticated ? '/(tabs)/explore' : '/login';
      router.replace(destination);
    }
  }, [isAuthenticated, loading, router]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>TATU</ThemedText>
      <ThemedText style={styles.subtitle}>Find, Preview and Book the Best Tattoo Artists</ThemedText>
      <ActivityIndicator size="large" color="#FFF" style={styles.loader} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
});
