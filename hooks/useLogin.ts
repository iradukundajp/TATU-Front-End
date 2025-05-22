import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export const useLogin = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)/explore');
    } catch (error) {
      console.error('Login error:', error);
      
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
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  
  const handleEmailFocus = () => setEmailFocused(true);
  const handleEmailBlur = () => setEmailFocused(false);
  
  const handlePasswordFocus = () => setPasswordFocused(true);
  const handlePasswordBlur = () => setPasswordFocused(false);

  const navigateToRegister = () => router.push('/register');

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    showPassword,
    emailFocused,
    passwordFocused,
    handleLogin,
    togglePasswordVisibility,
    handleEmailFocus,
    handleEmailBlur,
    handlePasswordFocus,
    handlePasswordBlur,
    navigateToRegister
  };
};