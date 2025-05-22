import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

type UserData = {
  name: string;
  email: string;
  password: string;
  isArtist: boolean;
};

export const useRegister = () => {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const isArtist = selectedRole === 'ARTIST';
      const userData: UserData = {
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
      
      // More user-friendly error message
      let errorMessage = 'Something went wrong';
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          errorMessage = 'Connection to server failed. Please check:\n\n' + 
                         '• Your backend server is running\n' +
                         '• Your phone and computer are on the same WiFi network\n' +
                         '• Server connection settings are configured correctly';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const navigateToLogin = () => router.push('/login');

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    selectedRole,
    setSelectedRole,
    loading,
    showPassword,
    nameFocused,
    emailFocused,
    passwordFocused,
    handleRegister,
    togglePasswordVisibility,
    navigateToLogin
  };
};