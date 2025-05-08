import React from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Login</ThemedText>
      {/* Add your login form components here */}
      <Button title="Login" onPress={() => {
        // Implement login logic here
        // For now, let's navigate to the main app (tabs)
        router.replace('/');
      }} />
      <Link href="/register" asChild>
        <TouchableOpacity style={styles.registerButton}>
          <ThemedText type="link">Don't have an account? Register</ThemedText>
        </TouchableOpacity>
      </Link>
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
    marginBottom: 20,
  },
  registerButton: {
    marginTop: 15,
    paddingVertical: 10,
  }
});
