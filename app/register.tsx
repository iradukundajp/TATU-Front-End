import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('USER');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const isArtist = selectedRole === 'ARTIST';
      
      // Log the data being sent to the API
      const userData = {
        name,
        email,
        password,
        isArtist,
      };
      console.log('Sending registration data:', JSON.stringify(userData));

      await register(userData);

      Alert.alert('Success', 'Registration successful!');
      router.replace('/(tabs)/explore');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Register</ThemedText>
      
      <ThemedText style={styles.roleSelectionTitle}>I want to register as a:</ThemedText>
      <View style={styles.roleSelectionContainer}>
        <TouchableFix
          style={[styles.roleButton, selectedRole === 'USER' && styles.roleButtonSelected]}
          onPress={() => setSelectedRole('USER')}
          disabled={loading}
        >
          <ThemedText style={[styles.roleButtonText, selectedRole === 'USER' && styles.roleButtonTextSelected]}>User</ThemedText>
        </TouchableFix>
        <TouchableFix
          style={[styles.roleButton, selectedRole === 'ARTIST' && styles.roleButtonSelected]}
          onPress={() => setSelectedRole('ARTIST')}
          disabled={loading}
        >
          <ThemedText style={[styles.roleButtonText, selectedRole === 'ARTIST' && styles.roleButtonTextSelected]}>Artist</ThemedText>
        </TouchableFix>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      
      <TouchableFix 
        style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <ThemedText style={styles.registerButtonText}>Register</ThemedText>
        )}
      </TouchableFix>
      
      <Link href="/login" asChild>
        <TouchableFix style={styles.loginLinkContainer} disabled={loading}>
          <ThemedText type="link">Already have an account? Login</ThemedText>
        </TouchableFix>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  roleSelectionTitle: {
    marginBottom: 10,
    fontSize: 16,
  },
  roleSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
  },
  roleButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleButtonText: {
    color: 'gray',
  },
  roleButtonTextSelected: {
    color: 'white',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    color: 'white',
    fontSize: 16,
  },
  registerButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 5,
  },
  registerButtonDisabled: {
    backgroundColor: '#4CAF5080',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    marginTop: 20,
    paddingVertical: 10,
  }
});
