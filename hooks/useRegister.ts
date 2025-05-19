import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  isArtist: boolean;
}

export default function useRegister() {
  const router = useRouter();
  const { register } = useAuth(); // This comes from your AuthContext

  // Form fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'USER' | 'ARTIST'>('USER');

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Register logic
  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const isArtist = selectedRole === 'ARTIST';
      const userData: RegisterData = { name, email, password, isArtist };

      await register(userData); // Call the register method from AuthContext

      Alert.alert('Success', 'Registration successful!');
      router.replace('/(tabs)/explore'); // Navigate to Explore tab
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error instanceof Error ? error.message : 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

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
    setShowPassword,
    handleRegister,
  };
}
