import React, { useState } from 'react'; // Added useState
import { View, Text, Button, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native'; // Added TextInput, Alert
import { useRouter, Link } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState(''); // Added email state
  const [password, setPassword] = useState(''); // Added password state

  const handleLogin = async () => { // Added handleLogin function
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
      if (!apiUrl) {
        Alert.alert('Error', 'API URL is not configured. Please check your .env.local file.');
        return;
      }
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data);
        router.replace('/explore'); // Navigate to explore on success
      } else {
        Alert.alert('Login Failed', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'An error occurred while trying to log in.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Login</ThemedText>
      <TextInput
        style={styles.input} // Added input style
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input} // Added input style
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
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
  input: { // Added input style definition
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    color: 'white',
  },
  registerButton: {
    marginTop: 15,
    paddingVertical: 10,
  }
});
