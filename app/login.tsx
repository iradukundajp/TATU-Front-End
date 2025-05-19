import React, { useState } from 'react';
import { View, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { loginStyles as styles } from '@/styles/loginStyles';
import Header from '@/components/Header';
import LoginForm from '@/components/LoginForm';
import Footer from '@/components/Footer';

export default function LoginScreen() {
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
      <Header
  title="Welcome back!"
  subtitle="Sign in to discover amazing tattoo artists"
/>
        <LoginForm
          emailFocused={emailFocused}
          setEmailFocused={setEmailFocused}
          passwordFocused={passwordFocused}
          setPasswordFocused={setPasswordFocused}
        />
        <Footer />
      </LinearGradient>
    </View>
  );
}
