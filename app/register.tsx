import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText'; // Added import for ThemedText
import { ThemedView } from '@/components/ThemedView'; // Added import for ThemedView

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('USER'); // Renamed state for clarity, still 'USER' | 'ARTIST'

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
      if (!apiUrl) {
        Alert.alert('Error', 'API URL is not configured. Please check your .env.local file.');
        return;
      }
      const isArtist = selectedRole === 'ARTIST'; // Determine isArtist based on selectedRole

      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          isArtist, // Send isArtist boolean instead of role string
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Registration successful! Please login.');
        router.replace('/login');
      } else {
        Alert.alert('Registration Failed', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Error', 'An error occurred during registration.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Register</ThemedText>
      {/* Role Selection UI */}
      <ThemedText style={styles.roleSelectionTitle}>I want to register as a:</ThemedText>
      <View style={styles.roleSelectionContainer}>
        <TouchableOpacity
          style={[styles.roleButton, selectedRole === 'USER' && styles.roleButtonSelected]}
          onPress={() => setSelectedRole('USER')}
        >
          <ThemedText style={[styles.roleButtonText, selectedRole === 'USER' && styles.roleButtonTextSelected]}>User</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, selectedRole === 'ARTIST' && styles.roleButtonSelected]}
          onPress={() => setSelectedRole('ARTIST')}
        >
          <ThemedText style={[styles.roleButtonText, selectedRole === 'ARTIST' && styles.roleButtonTextSelected]}>Artist</ThemedText>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Register" onPress={handleRegister} />
      <Link href="/login" asChild>
        <TouchableOpacity style={styles.loginLinkContainer}>
          <ThemedText type="link">Already have an account? Login</ThemedText>
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
  roleSelectionTitle: { // Style for the role selection title
    marginBottom: 10,
    fontSize: 16,
    // Consider theming this color if needed
  },
  roleSelectionContainer: { // Style for the role buttons container
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  roleButton: { // Style for individual role button
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
  },
  roleButtonSelected: { // Style for selected role button
    backgroundColor: '#007AFF', // Example selected color, adjust as needed
    borderColor: '#007AFF',
  },
  roleButtonText: { // Style for role button text
    color: 'gray',
  },
  roleButtonTextSelected: { // Style for selected role button text
    color: 'white',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
    color: 'white',
  },
  loginLinkContainer: {
    marginTop: 15,
    paddingVertical: 10,
  }
});
