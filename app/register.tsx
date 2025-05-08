import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function RegisterScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Register</ThemedText>
      {/* Add your registration form components here */}
      <ThemedText style={styles.text}>This is the registration page.</ThemedText>
      <Link href="/login" style={styles.loginLink}>
        <ThemedText type="link">Already have an account? Login</ThemedText>
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
  text: {
    marginVertical: 20,
  },
  loginLink: {
    marginTop: 15,
    paddingVertical: 10,
  }
});
